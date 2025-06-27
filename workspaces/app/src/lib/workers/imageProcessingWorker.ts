/**
 * Web Worker用の画像処理スクリプト
 * メインスレッドをブロックしない画像処理
 */

interface ImageProcessingMessage {
  type: 'PROCESS_IMAGE';
  data: {
    imageData: ImageData;
    width: number;
    height: number;
    quality: number;
    format: 'jpg' | 'webp';
    cacheKey: string;
  };
}

interface ImageProcessingResponse {
  type: 'IMAGE_PROCESSED';
  data: {
    dataUrl: string;
    cacheKey: string;
  } | {
    error: string;
    cacheKey: string;
  };
}

// Web Worker内での処理
self.onmessage = function(e: MessageEvent<ImageProcessingMessage>) {
  const { type, data } = e.data;
  
  if (type === 'PROCESS_IMAGE') {
    try {
      // OffscreenCanvasで画像処理
      const canvas = new OffscreenCanvas(data.width, data.height);
      const ctx = canvas.getContext('2d')!;
      
      // ImageDataをキャンバスに描画
      ctx.putImageData(data.imageData, 0, 0);
      
      // Blobに変換
      canvas.convertToBlob({
        type: data.format === 'webp' ? 'image/webp' : 'image/jpeg',
        quality: data.quality
      }).then(blob => {
        // BlobをDataURLに変換
        const reader = new FileReader();
        reader.onload = () => {
          const response: ImageProcessingResponse = {
            type: 'IMAGE_PROCESSED',
            data: {
              dataUrl: reader.result as string,
              cacheKey: data.cacheKey
            }
          };
          self.postMessage(response);
        };
        reader.readAsDataURL(blob);
      }).catch(error => {
        const response: ImageProcessingResponse = {
          type: 'IMAGE_PROCESSED',
          data: {
            error: error.message,
            cacheKey: data.cacheKey
          }
        };
        self.postMessage(response);
      });
      
    } catch (error) {
      const response: ImageProcessingResponse = {
        type: 'IMAGE_PROCESSED',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          cacheKey: data.cacheKey
        }
      };
      self.postMessage(response);
    }
  }
};
