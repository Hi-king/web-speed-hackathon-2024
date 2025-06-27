/**
 * 重要なアセットをプリロードするコンポーネント
 * Head内で使用してリソースの読み込みを高速化
 */

import React from 'react';

export const AssetPreloader: React.FC = () => {
  React.useEffect(() => {
    // 重要な画像をプリロード
    const preloadImage = (src: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    };

    // フッターのロゴをプリロード
    preloadImage('/assets/cyber-toon.svg');
    
    // その他の重要な画像もプリロードできます
    // preloadImage('/assets/heroImage.png');
    
  }, []);

  return null;
};
