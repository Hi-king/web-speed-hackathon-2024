import { Dialog } from './foundation/components/Dialog';
import { GlobalStyle } from './foundation/styles/GlobalStyle';
import { Router } from './routes';
import { PerformanceMonitor } from './components/PerformanceMonitor';

export const ClientApp: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <Dialog />
      <Router />
      <PerformanceMonitor />
    </>
  );
};
