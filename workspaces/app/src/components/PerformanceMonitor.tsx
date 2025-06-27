import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { performanceLogger, webVitalsLogger } from '../lib/performance';

const PerformanceOverlay = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 16px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  max-width: 300px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 9999;
  border: 1px solid #444;
`;

const ToggleButton = styled.button`
  position: fixed;
  top: 10px;
  right: 320px;
  background: #007acc;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  z-index: 10000;
  
  &:hover {
    background: #005a9a;
  }
`;

const ClearButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  margin-bottom: 8px;
  
  &:hover {
    background: #c82333;
  }
`;

const MetricItem = styled.div<{ $isHigh: boolean; $isMed: boolean }>`
  padding: 2px 0;
  color: ${props => props.$isHigh ? '#ff6b6b' : props.$isMed ? '#ffd93d' : '#6bcf7f'};
`;

export const PerformanceMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [webVitals, setWebVitals] = useState<any>({});

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const report = performanceLogger.getReport();
      const vitals = webVitalsLogger.getLatestMetrics();
      setMetrics(report);
      setWebVitals(vitals);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleClear = () => {
    performanceLogger.clear();
    setMetrics([]);
  };

  if (process.env['NODE_ENV'] !== 'development') {
    return null;
  }

  return (
    <>
      <ToggleButton onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? 'Hide' : 'Show'} Perf
      </ToggleButton>
      
      {isVisible && (
        <PerformanceOverlay>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong>Performance Metrics</strong>
            <ClearButton onClick={handleClear}>Clear</ClearButton>
          </div>
          
          {/* Web Vitals セクション */}
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ fontSize: '11px' }}>Web Vitals:</strong>
            {Object.keys(webVitals).length === 0 ? (
              <div style={{ fontSize: '10px', opacity: 0.7 }}>Loading...</div>
            ) : (
              <div>
                {Object.entries(webVitals).map(([name, metric]: [string, any]) => {
                  const color = metric.rating === 'good' ? '🟢' : metric.rating === 'needs-improvement' ? '🟡' : '🔴';
                  return (
                    <div key={name} style={{ fontSize: '10px', margin: '2px 0' }}>
                      {color} {name}: {metric.value.toFixed(2)}ms
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* パフォーマンスメトリクス */}
          <div>
            <strong style={{ fontSize: '11px' }}>Custom Metrics:</strong>
            {metrics.length === 0 ? (
              <div style={{ fontSize: '10px', opacity: 0.7 }}>No metrics recorded</div>
            ) : (
              <div>
                {metrics
                  .sort((a, b) => (b.duration || 0) - (a.duration || 0))
                  .slice(0, 15) // 最新15件のみ表示
                  .map((metric, index) => {
                    const duration = metric.duration || 0;
                    const isHigh = duration > 100;
                    const isMed = duration > 50;
                    
                    return (
                      <MetricItem key={index} $isHigh={isHigh} $isMed={isMed}>
                        <div>{metric.name}</div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>
                          {duration.toFixed(2)}ms
                        </div>
                      </MetricItem>
                    );
                  })}
              </div>
            )}
          </div>
        </PerformanceOverlay>
      )}
    </>
  );
};
