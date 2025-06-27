/**
 * Web Vitals メトリクス測定ユーティリティ
 */

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

class WebVitalsLogger {
  private metrics: WebVitalsMetric[] = [];
  private observer: PerformanceObserver | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObserver();
      this.measureInitialMetrics();
    }
  }

  private initializeObserver() {
    try {
      // Core Web Vitals の測定
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            this.recordMetric('LCP', entry.startTime, this.getLCPRating(entry.startTime));
          } else if (entry.entryType === 'first-input') {
            const fidEntry = entry as PerformanceEventTiming;
            const fid = fidEntry.processingStart - fidEntry.startTime;
            this.recordMetric('FID', fid, this.getFIDRating(fid));
          } else if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            const clsEntry = entry as any;
            this.recordMetric('CLS', clsEntry.value, this.getCLSRating(clsEntry.value));
          }
        }
      });

      this.observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      console.warn('Failed to initialize Web Vitals observer:', error);
    }
  }

  private measureInitialMetrics() {
    // FCP (First Contentful Paint) の測定
    const fcpEntries = performance.getEntriesByName('first-contentful-paint');
    if (fcpEntries.length > 0 && fcpEntries[0]) {
      const fcp = fcpEntries[0].startTime;
      this.recordMetric('FCP', fcp, this.getFCPRating(fcp));
    }

    // TTFB (Time to First Byte) の測定
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0 && navigationEntries[0]) {
      const ttfb = navigationEntries[0].responseStart - navigationEntries[0].requestStart;
      this.recordMetric('TTFB', ttfb, this.getTTFBRating(ttfb));
    }
  }

  private recordMetric(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') {
    const metric: WebVitalsMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    
    const color = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
    console.log(`${color} [Web Vitals] ${name}: ${value.toFixed(2)}ms (${rating})`);
  }

  private getLCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  private getFIDRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  private getCLSRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  private getFCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  private getTTFBRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 800) return 'good';
    if (value <= 1800) return 'needs-improvement';
    return 'poor';
  }

  getMetrics(): WebVitalsMetric[] {
    return [...this.metrics];
  }

  getLatestMetrics(): Record<string, WebVitalsMetric> {
    const latest: Record<string, WebVitalsMetric> = {};
    
    for (const metric of this.metrics) {
      if (!latest[metric.name] || metric.timestamp > (latest[metric.name]?.timestamp ?? 0)) {
        latest[metric.name] = metric;
      }
    }
    
    return latest;
  }

  clear() {
    this.metrics = [];
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// シングルトンインスタンス
export const webVitalsLogger = new WebVitalsLogger();
