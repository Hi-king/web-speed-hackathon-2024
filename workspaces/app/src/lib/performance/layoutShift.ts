/**
 * より詳細なレイアウトシフト分析ツール
 */

interface LayoutShiftDetail {
  score: number;
  timestamp: number;
  sources: {
    node: Element;
    currentRect: DOMRect;
    previousRect: DOMRect;
  }[];
  hadRecentInput: boolean;
}

class LayoutShiftAnalyzer {
  private shifts: LayoutShiftDetail[] = [];
  private observer: PerformanceObserver | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.isEnabled = process.env['NODE_ENV'] === 'development';
    if (this.isEnabled && typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObserver();
    }
  }

  private initializeObserver() {
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift') {
            const layoutShiftEntry = entry as any;
            
            // 最近のユーザー入力による変更は除外
            if (layoutShiftEntry.hadRecentInput) {
              continue;
            }

            const detail: LayoutShiftDetail = {
              score: layoutShiftEntry.value,
              timestamp: entry.startTime,
              sources: layoutShiftEntry.sources || [],
              hadRecentInput: layoutShiftEntry.hadRecentInput,
            };

            this.shifts.push(detail);
            this.logLayoutShift(detail);
          }
        }
      });

      this.observer.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('Failed to initialize Layout Shift observer:', error);
    }
  }

  private logLayoutShift(detail: LayoutShiftDetail) {
    const severity = this.getShiftSeverity(detail.score);
    const color = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';
    
    console.group(`${color} [Layout Shift] Score: ${detail.score.toFixed(4)} (${severity})`);
    console.log(`Timestamp: ${detail.timestamp.toFixed(2)}ms`);
    
    if (detail.sources.length > 0) {
      console.log('Affected elements:');
      detail.sources.forEach((source, index) => {
        console.log(`  ${index + 1}. ${this.getElementSelector(source.node)}`);
        console.log(`     Previous: ${this.rectToString(source.previousRect)}`);
        console.log(`     Current:  ${this.rectToString(source.currentRect)}`);
        console.log(`     Movement: ${this.calculateMovement(source.previousRect, source.currentRect)}`);
      });
    }
    
    console.groupEnd();

    // 累積スコアも表示
    const totalScore = this.getTotalScore();
    if (totalScore > 0.1) {
      console.warn(`🚨 Total CLS Score: ${totalScore.toFixed(4)} (Poor: > 0.25, Needs Improvement: > 0.1)`);
    }
  }

  private getShiftSeverity(score: number): 'low' | 'medium' | 'high' {
    if (score < 0.01) return 'low';
    if (score < 0.1) return 'medium';
    return 'high';
  }

  private getElementSelector(element: Element): string {
    // より詳細なセレクターを生成
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className ? `.${element.className.replace(/\s+/g, '.')}` : '';
    
    let selector = `${tagName}${id}${classes}`;
    
    // 親要素の情報も追加
    const parent = element.parentElement;
    if (parent && parent !== document.body) {
      const parentTag = parent.tagName.toLowerCase();
      const parentClass = parent.className ? `.${parent.className.split(' ')[0]}` : '';
      selector = `${parentTag}${parentClass} > ${selector}`;
    }
    
    return selector;
  }

  private rectToString(rect: DOMRect): string {
    return `x:${rect.x.toFixed(1)}, y:${rect.y.toFixed(1)}, w:${rect.width.toFixed(1)}, h:${rect.height.toFixed(1)}`;
  }

  private calculateMovement(prev: DOMRect, current: DOMRect): string {
    const deltaX = current.x - prev.x;
    const deltaY = current.y - prev.y;
    const deltaW = current.width - prev.width;
    const deltaH = current.height - prev.height;
    
    return `Δx:${deltaX.toFixed(1)}, Δy:${deltaY.toFixed(1)}, Δw:${deltaW.toFixed(1)}, Δh:${deltaH.toFixed(1)}`;
  }

  getTotalScore(): number {
    // 5秒間のウィンドウで最大値を計算
    const now = performance.now();
    const windowShifts = this.shifts.filter(shift => now - shift.timestamp <= 5000);
    
    return windowShifts.reduce((total, shift) => total + shift.score, 0);
  }

  getShiftsByElement(): Record<string, { count: number; totalScore: number; avgScore: number }> {
    const elementStats: Record<string, { count: number; totalScore: number }> = {};
    
    this.shifts.forEach(shift => {
      shift.sources.forEach(source => {
        const selector = this.getElementSelector(source.node);
        if (!elementStats[selector]) {
          elementStats[selector] = { count: 0, totalScore: 0 };
        }
        elementStats[selector].count++;
        elementStats[selector].totalScore += shift.score;
      });
    });

    // 平均スコアを計算
    const result: Record<string, { count: number; totalScore: number; avgScore: number }> = {};
    Object.entries(elementStats).forEach(([selector, stats]) => {
      result[selector] = {
        ...stats,
        avgScore: stats.totalScore / stats.count,
      };
    });

    return result;
  }

  printReport(): void {
    if (!this.isEnabled) return;

    console.group('📊 [Layout Shift Report]');
    
    const totalScore = this.getTotalScore();
    const color = totalScore > 0.25 ? '🔴' : totalScore > 0.1 ? '🟡' : '🟢';
    console.log(`${color} Total CLS Score: ${totalScore.toFixed(4)}`);
    
    const elementStats = this.getShiftsByElement();
    const sortedElements = Object.entries(elementStats)
      .sort(([,a], [,b]) => b.totalScore - a.totalScore)
      .slice(0, 10);
    
    if (sortedElements.length > 0) {
      console.log('\nTop problematic elements:');
      sortedElements.forEach(([selector, stats], index) => {
        const severity = stats.avgScore > 0.1 ? '🔴' : stats.avgScore > 0.01 ? '🟡' : '🟢';
        console.log(`${index + 1}. ${severity} ${selector}`);
        console.log(`   Count: ${stats.count}, Total: ${stats.totalScore.toFixed(4)}, Avg: ${stats.avgScore.toFixed(4)}`);
      });
    }
    
    console.groupEnd();
  }

  clear(): void {
    this.shifts = [];
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

export const layoutShiftAnalyzer = new LayoutShiftAnalyzer();
