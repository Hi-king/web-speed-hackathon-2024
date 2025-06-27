import { useAsync } from 'react-use';
import { performanceLogger } from '../../lib/performance';
import { getImageUrl } from '../../lib/image/getImageUrl';

// 画像キャッシュ
const imageCache = new Map<string, string>();

export const useImage = ({ height, imageId, width }: { height: number; imageId: string; width: number }) => {
  const { value } = useAsync(async () => {
    const cacheKey = `${imageId}-${width}-${height}`;
    
    // キャッシュから取得
    if (imageCache.has(cacheKey)) {
      console.log(`🟢 [ImageCache] Cache hit for ${cacheKey}`);
      return imageCache.get(cacheKey)!;
    }

    return performanceLogger.measureAsync(
      `useImage-${imageId}`,
      async () => {
        // devicePixelRatioを制限してパフォーマンス向上
        const dpr = Math.min(window.devicePixelRatio, 2);

        performanceLogger.start(`image-load-${imageId}`);
        const img = new Image();
        img.src = getImageUrl({
          format: 'jpg',
          height: height * dpr,
          imageId,
          width: width * dpr,
        });

        await img.decode();
        performanceLogger.end(`image-load-${imageId}`);

        performanceLogger.start(`canvas-setup-${imageId}`);
        const canvas = document.createElement('canvas');
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        const ctx = canvas.getContext('2d')!;

        // 画像スムージングを最適化
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium'; // 'high' から 'medium' に変更してパフォーマンス向上
        performanceLogger.end(`canvas-setup-${imageId}`);

        performanceLogger.start(`canvas-draw-${imageId}`);
        // Draw image to canvas as object-fit: cover（最適化版）
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const targetAspect = width / height;

        if (imgAspect > targetAspect) {
          const srcW = img.naturalHeight * targetAspect;
          const srcH = img.naturalHeight;
          const srcX = (img.naturalWidth - srcW) / 2;
          const srcY = 0;
          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, width * dpr, height * dpr);
        } else {
          const srcW = img.naturalWidth;
          const srcH = img.naturalWidth / targetAspect;
          const srcX = 0;
          const srcY = (img.naturalHeight - srcH) / 2;
          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, width * dpr, height * dpr);
        }
        performanceLogger.end(`canvas-draw-${imageId}`);

        // toDataURL を最適化（JPEG + 品質85%でバランス取る）
        performanceLogger.start(`toDataURL-${imageId}`);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        performanceLogger.end(`toDataURL-${imageId}`);

        // キャッシュに保存（最大50件でメモリ使用量を制限）
        if (imageCache.size >= 50) {
          const firstKey = imageCache.keys().next().value;
          if (firstKey) {
            imageCache.delete(firstKey);
          }
        }
        imageCache.set(cacheKey, dataUrl);

        return dataUrl;
      },
      { imageId, width, height }
    );
  }, [height, imageId, width]);

  return value;
};
