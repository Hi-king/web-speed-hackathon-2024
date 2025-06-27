/**
 * パフォーマンス測定用のログユーティリティ
 */

interface PerformanceData {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceLogger {
  private measurements: Map<string, PerformanceData> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    // 開発環境でのみ有効にする
    this.isEnabled = process.env['NODE_ENV'] === 'development';
  }

  /**
   * 測定を開始する
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const startTime = performance.now();
    this.measurements.set(name, {
      name,
      startTime,
      metadata,
    });

    console.log(`🚀 [Performance] Started: ${name}`, metadata);
  }

  /**
   * 測定を終了する
   */
  end(name: string, metadata?: Record<string, any>): number | null {
    if (!this.isEnabled) return null;

    const measurement = this.measurements.get(name);
    if (!measurement) {
      console.warn(`⚠️ [Performance] No measurement found for: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - measurement.startTime;

    measurement.endTime = endTime;
    measurement.duration = duration;

    const color = duration > 100 ? '🔴' : duration > 50 ? '🟡' : '🟢';
    console.log(`${color} [Performance] Finished: ${name} - ${duration.toFixed(2)}ms`, {
      ...measurement.metadata,
      ...metadata,
    });

    return duration;
  }

  /**
   * 非同期関数の実行時間を測定する
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * 同期関数の実行時間を測定する
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * 全ての測定結果を表示する
   */
  getReport(): PerformanceData[] {
    return Array.from(this.measurements.values()).filter(m => m.duration !== undefined);
  }

  /**
   * 測定結果をコンソールに出力する
   */
  printReport(): void {
    if (!this.isEnabled) return;

    const report = this.getReport();
    if (report.length === 0) {
      console.log('📊 [Performance] No measurements recorded');
      return;
    }

    console.group('📊 [Performance] Report');
    report
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .forEach(measurement => {
        const duration = measurement.duration || 0;
        const color = duration > 100 ? '🔴' : duration > 50 ? '🟡' : '🟢';
        console.log(`${color} ${measurement.name}: ${duration.toFixed(2)}ms`);
      });
    console.groupEnd();
  }

  /**
   * すべての測定結果をクリアする
   */
  clear(): void {
    this.measurements.clear();
  }
}

// シングルトンインスタンス
export const performanceLogger = new PerformanceLogger();

// React Hook用のユーティリティ
export const usePerformanceLogger = () => {
  return performanceLogger;
};
