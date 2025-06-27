/**
 * デバッグ用のグローバル関数を追加
 * ブラウザのコンソールで直接呼び出せるように window オブジェクトに追加
 */

import { performanceLogger, webVitalsLogger, layoutShiftAnalyzer } from './index';

declare global {
  interface Window {
    // パフォーマンス関連のデバッグ関数
    perfReport: () => void;
    perfClear: () => void;
    vitalsReport: () => void;
    layoutReport: () => void;
    fullReport: () => void;
  }
}

if (typeof window !== 'undefined' && process.env['NODE_ENV'] === 'development') {
  // パフォーマンスレポートを表示
  window.perfReport = () => {
    performanceLogger.printReport();
  };

  // パフォーマンスデータをクリア
  window.perfClear = () => {
    performanceLogger.clear();
    webVitalsLogger.clear();
    layoutShiftAnalyzer.clear();
    console.log('✅ All performance data cleared');
  };

  // Web Vitals レポート
  window.vitalsReport = () => {
    const vitals = webVitalsLogger.getLatestMetrics();
    console.group('📊 [Web Vitals Report]');
    
    if (Object.keys(vitals).length === 0) {
      console.log('No Web Vitals data available yet');
    } else {
      Object.entries(vitals).forEach(([name, metric]: [string, any]) => {
        const color = metric.rating === 'good' ? '🟢' : metric.rating === 'needs-improvement' ? '🟡' : '🔴';
        console.log(`${color} ${name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
      });
    }
    
    console.groupEnd();
  };

  // レイアウトシフトレポート
  window.layoutReport = () => {
    layoutShiftAnalyzer.printReport();
  };

  // 全てのレポートを表示
  window.fullReport = () => {
    console.group('🔍 [Full Performance Report]');
    window.vitalsReport();
    window.perfReport();
    window.layoutReport();
    console.groupEnd();
  };

  // 初回読み込み時にヘルプメッセージを表示
  console.log(`
🔍 Performance Debug Commands Available:
  perfReport()    - Show custom performance metrics
  vitalsReport()  - Show Web Vitals metrics  
  layoutReport()  - Show layout shift analysis
  fullReport()    - Show all reports
  perfClear()     - Clear all performance data
  
Try running: fullReport()
  `);
}
