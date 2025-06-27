import React from 'react';

/**
 * ハイドレーション後にのみコンテンツを表示するコンポーネント
 * レイアウトシフトを最小化するため、初期状態でもプレースホルダーを表示
 */
interface NoSSRProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const NoSSR: React.FC<NoSSRProps> = ({ children, fallback = null }) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted ? <>{children}</> : <>{fallback}</>;
};
