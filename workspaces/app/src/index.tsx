import { Dialog } from './foundation/components/Dialog';
import { GlobalStyle } from './foundation/styles/GlobalStyle';
import { Router } from './routes';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { AssetPreloader } from './lib/optimization/AssetPreloader';

// デバッグ用の関数を初期化（開発環境のみ）
import './lib/performance/debug';

export const ClientApp: React.FC = () => {
  return (
    <>
      <AssetPreloader />
      <GlobalStyle />
      <Dialog />
      <Router />
      <PerformanceMonitor />
    </>
  );
};
