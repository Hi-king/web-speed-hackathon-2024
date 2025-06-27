/**
 * RequestIdleCallback を使用した低優先度の画像処理
 * メインスレッドの負荷を軽減
 */

interface IdleImageProcessingOptions {
  timeout?: number;
  priority?: 'high' | 'normal' | 'low';
}

export const processImageInIdle = (
  canvas: HTMLCanvasElement,
  options: IdleImageProcessingOptions = {}
): Promise<string> => {
  const { timeout = 5000, priority = 'normal' } = options;

  return new Promise((resolve, reject) => {
    const startTime = performance.now();

    const processImage = (deadline?: IdleDeadline) => {
      try {
        // 優先度に応じて品質を調整
        const quality = priority === 'high' ? 0.95 : priority === 'normal' ? 0.85 : 0.75;
        const format = priority === 'high' ? 'image/png' : 'image/jpeg';
        
        // アイドル時間が十分にある場合のみ処理
        if (!deadline || deadline.timeRemaining() > 10) {
          const dataUrl = canvas.toDataURL(format, quality);
          resolve(dataUrl);
        } else if (performance.now() - startTime > timeout) {
          // タイムアウトの場合は低品質で処理
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        } else {
          // 再スケジュール
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(processImage, { timeout: timeout });
          } else {
            // フォールバック
            setTimeout(() => processImage(), 16);
          }
        }
      } catch (error) {
        reject(error);
      }
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(processImage, { timeout: timeout });
    } else {
      // requestIdleCallback が利用できない場合のフォールバック
      setTimeout(() => processImage(), 0);
    }
  });
};
