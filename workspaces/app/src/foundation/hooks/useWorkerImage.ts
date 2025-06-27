import { useAsync } from 'react-use';
import { performanceLogger } from '../../lib/performance';
import { getImageUrl } from '../../lib/image/getImageUrl';

// Web Worker の管理
let imageWorker: Worker | null = null;
const pendingTasks = new Map<string, { resolve: (value: string) => void; reject: (error: Error) => void }>();

// Web Worker を初期化
const initWorker = () => {
  if (!imageWorker && typeof Worker !== 'undefined') {
    try {
      // インラインワーカーとして作成
      const workerCode = `
        self.onmessage = function(e) {
          const { type, data } = e.data;
          
          if (type === 'PROCESS_IMAGE') {
            try {
              const canvas = new OffscreenCanvas(data.width, data.height);
              const ctx = canvas.getContext('2d');
              
              ctx.putImageData(data.imageData, 0, 0);
              
              canvas.convertToBlob({
                type: data.format === 'webp' ? 'image/webp' : 'image/jpeg',
                quality: data.quality
              }).then(blob => {
                const reader = new FileReader();
                reader.onload = () => {
                  self.postMessage({
                    type: 'IMAGE_PROCESSED',
                    data: {
                      dataUrl: reader.result,
                      cacheKey: data.cacheKey
                    }
                  });
                };
                reader.readAsDataURL(blob);
              }).catch(error => {
                self.postMessage({
                  type: 'IMAGE_PROCESSED',
                  data: {
                    error: error.message,
                    cacheKey: data.cacheKey
                  }
                });
              });
              
            } catch (error) {
              self.postMessage({
                type: 'IMAGE_PROCESSED',
                data: {
                  error: error.message,
                  cacheKey: data.cacheKey
                }
              });
            }
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      imageWorker = new Worker(URL.createObjectURL(blob));
      
      imageWorker.onmessage = (e) => {
        const { type, data } = e.data;
        
        if (type === 'IMAGE_PROCESSED') {
          const task = pendingTasks.get(data.cacheKey);
          if (task) {
            pendingTasks.delete(data.cacheKey);
            if ('error' in data) {
              task.reject(new Error(data.error));
            } else {
              task.resolve(data.dataUrl);
            }
          }
        }
      };
      
    } catch (error) {
      console.warn('Failed to create image processing worker:', error);
    }
  }
};

// Web Worker で画像を処理
const processImageWithWorker = (
  imageData: ImageData,
  width: number,
  height: number,
  quality: number,
  format: 'jpg' | 'webp',
  cacheKey: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!imageWorker) {
      reject(new Error('Worker not available'));
      return;
    }
    
    pendingTasks.set(cacheKey, { resolve, reject });
    
    imageWorker.postMessage({
      type: 'PROCESS_IMAGE',
      data: {
        imageData,
        width,
        height,
        quality,
        format,
        cacheKey
      }
    });
    
    // タイムアウト処理
    setTimeout(() => {
      if (pendingTasks.has(cacheKey)) {
        pendingTasks.delete(cacheKey);
        reject(new Error('Worker processing timeout'));
      }
    }, 10000); // 10秒でタイムアウト
  });
};

// キャッシュ
const imageCache = new Map<string, string>();

export const useWorkerImage = ({ 
  height, 
  imageId, 
  width,
  quality = 0.8,
  format = 'jpg' as 'jpg' | 'webp',
  useWorker = true
}: { 
  height: number; 
  imageId: string; 
  width: number;
  quality?: number;
  format?: 'jpg' | 'webp';
  useWorker?: boolean;
}) => {
  const { value } = useAsync(async () => {
    const cacheKey = `${imageId}-${width}-${height}-${quality}-${format}`;
    
    // キャッシュチェック
    if (imageCache.has(cacheKey)) {
      return imageCache.get(cacheKey)!;
    }

    return performanceLogger.measureAsync(
      `useWorkerImage-${imageId}`,
      async () => {
        const dpr = Math.min(window.devicePixelRatio, 2);

        const img = new Image();
        img.src = getImageUrl({
          format,
          height: height * dpr,
          imageId,
          width: width * dpr,
        });

        await img.decode();

        // Canvas で画像を描画
        const canvas = document.createElement('canvas');
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        const ctx = canvas.getContext('2d')!;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // object-fit: cover の計算
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

        let dataUrl: string;

        // Web Worker を使用する場合
        if (useWorker && typeof Worker !== 'undefined') {
          try {
            initWorker();
            
            if (imageWorker) {
              const imageData = ctx.getImageData(0, 0, width * dpr, height * dpr);
              dataUrl = await processImageWithWorker(
                imageData,
                width * dpr,
                height * dpr,
                quality,
                format,
                cacheKey
              );
            } else {
              // フォールバック
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
          } catch (error) {
            console.warn('Worker processing failed, using fallback:', error);
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } else {
          // 通常の処理
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // キャッシュに保存
        if (imageCache.size >= 100) {
          const firstKey = imageCache.keys().next().value;
          if (firstKey) {
            imageCache.delete(firstKey);
          }
        }
        imageCache.set(cacheKey, dataUrl);

        return dataUrl;
      },
      { imageId, width, height, format, quality, useWorker }
    );
  }, [height, imageId, width, quality, format, useWorker]);

  return value;
};
