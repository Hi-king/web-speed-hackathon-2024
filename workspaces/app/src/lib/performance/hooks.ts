import { useEffect, useRef, useState } from 'react';
import { performanceLogger } from './logger';

/**
 * コンポーネントのレンダリング時間を測定するHook
 */
export const useRenderPerformance = (componentName: string, dependencies?: any[]) => {
  const renderStartTime = useRef<number>(performance.now());

  useEffect(() => {
    const renderEndTime = performance.now();
    const renderDuration = renderEndTime - renderStartTime.current;
    
    const color = renderDuration > 50 ? '🔴' : renderDuration > 20 ? '🟡' : '🟢';
    console.log(`${color} [Render] ${componentName}: ${renderDuration.toFixed(2)}ms`);
    
    // 次回のレンダリング用にリセット
    renderStartTime.current = performance.now();
  }, dependencies);
};

/**
 * エフェクトの実行時間を測定するHook
 */
export const useEffectPerformance = (
  name: string,
  effect: () => void | (() => void),
  dependencies: any[]
) => {
  useEffect(() => {
    return performanceLogger.measure(`Effect: ${name}`, effect);
  }, dependencies);
};

/**
 * 非同期エフェクトの実行時間を測定するHook
 */
export const useAsyncEffectPerformance = (
  name: string,
  effect: () => Promise<void>,
  dependencies: any[]
) => {
  useEffect(() => {
    performanceLogger.measureAsync(`AsyncEffect: ${name}`, effect);
  }, dependencies);
};

/**
 * 状態更新のパフォーマンスを測定するHook
 */
export const useStatePerformance = <T>(
  name: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [state, setState] = useState(initialValue);

  const setStateWithPerformance = (value: T | ((prev: T) => T)) => {
    performanceLogger.start(`State Update: ${name}`);
    setState(value);
    // 次のレンダリングで測定終了
    setTimeout(() => performanceLogger.end(`State Update: ${name}`), 0);
  };

  return [state, setStateWithPerformance];
};
