import { useAsync } from 'react-use';
import { performanceLogger } from '../../lib/performance';
import { getImageUrl } from '../../lib/image/getImageUrl';

// キャッシュ用のMap
const imageCache = new Map<string, string>();

export const useOptimizedImage = ({ 
  height, 
  imageId, 
  width,
  quality = 0.8, // JPEG品質（デフォルト80%）
  format = 'jpg' as 'jpg' | 'webp' // フォーマット指定
}: { 
  height: number; 
  imageId: string; 
  width: number;
  quality?: number;
  format?: 'jpg' | 'webp';
}) => {
  const { value } = useAsync(async () => {
    const cacheKey = `${imageId}-${width}-${height}-${quality}-${format}`;
    
    // キャッシュチェック
    if (imageCache.has(cacheKey)) {
      console.log(`🟢 [ImageCache] Hit: ${cacheKey}`);
      return imageCache.get(cacheKey)!;
    }

    return performanceLogger.measureAsync(
      `useOptimizedImage-${imageId}`,
      async () => {
        const dpr = Math.min(window.devicePixelRatio, 2); // DPRを制限して処理負荷を軽減

        const img = new Image();
        img.src = getImageUrl({
          format,
          height: height * dpr,
          imageId,
          width: width * dpr,
        });

        performanceLogger.start(`image-decode-${imageId}`);
        await img.decode();
        performanceLogger.end(`image-decode-${imageId}`);

        performanceLogger.start(`canvas-processing-${imageId}`);
        
        // OffscreenCanvasを使用（利用可能な場合）
        let canvas: HTMLCanvasElement | OffscreenCanvas;
        let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
        
        if ('OffscreenCanvas' in window) {
          canvas = new OffscreenCanvas(width * dpr, height * dpr);
          ctx = canvas.getContext('2d')!;
        } else {
          canvas = document.createElement('canvas');
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx = canvas.getContext('2d')!;
        }

        // 画像品質の最適化
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image to canvas as object-fit: cover（最適化版）
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const targetAspect = width / height;

        let srcX: number, srcY: number, srcW: number, srcH: number;

        if (imgAspect > targetAspect) {
          srcW = img.naturalHeight * targetAspect;
          srcH = img.naturalHeight;
          srcX = (img.naturalWidth - srcW) / 2;
          srcY = 0;
        } else {
          srcW = img.naturalWidth;
          srcH = img.naturalWidth / targetAspect;
          srcX = 0;
          srcY = (img.naturalHeight - srcH) / 2;
        }

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, width * dpr, height * dpr);
        
        performanceLogger.end(`canvas-processing-${imageId}`);

        // toDataURLの最適化
        performanceLogger.start(`toDataURL-${imageId}`);
        
        let dataUrl: string;
        
        // OffscreenCanvasの場合はconvertToBlobを使用
        if (canvas instanceof OffscreenCanvas) {
          const blob = await canvas.convertToBlob({
            type: format === 'webp' ? 'image/webp' : 'image/jpeg',
            quality: quality
          });
          dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } else {
          // HTMLCanvasの場合はtoDataURLを使用
          if (format === 'webp') {
            dataUrl = canvas.toDataURL('image/webp', quality);
          } else {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        }
        
        performanceLogger.end(`toDataURL-${imageId}`);

        // キャッシュに保存（メモリ使用量を考慮して最大100件）
        if (imageCache.size >= 100) {
          const firstKey = imageCache.keys().next().value;
          if (firstKey) {
            imageCache.delete(firstKey);
          }
        }
        imageCache.set(cacheKey, dataUrl);

        return dataUrl;
      },
      { imageId, width, height, format, quality }
    );
  }, [height, imageId, width, quality, format]);

  return value;
};

// 元のuseImageとの互換性を保つためのラッパー
export const useImage = (props: { height: number; imageId: string; width: number }) => {
  return useOptimizedImage({
    ...props,
    quality: 0.85,
    format: 'jpg'
  });
};
