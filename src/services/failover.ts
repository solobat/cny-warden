import { BaseFinanceService } from './base';
import { SecurityInfo, PriceData, SearchResult } from './types';
import { FinanceServiceFactory, DataSource } from './factory';

export class FailoverFinanceService extends BaseFinanceService {
  private readonly dataSources: DataSource[] = ['eastmoney', 'sina'];
  private currentSourceIndex = 0;
  private failureCount = new Map<DataSource, number>();
  private readonly maxFailures = 3;  // 连续失败3次后切换数据源
  private readonly failureResetInterval = 5 * 60 * 1000;  // 5分钟后重置失败计数
  private readonly failureTimeouts = new Map<DataSource, NodeJS.Timeout>();

  protected async fetchSecurityInfo(code: string): Promise<SecurityInfo> {
    return this.withFailover((service) => service.getSecurityInfo(code));
  }

  protected async fetchPriceData(code: string): Promise<PriceData> {
    return this.withFailover((service) => service.getPriceData(code));
  }

  protected async searchSecurities(query: string): Promise<SearchResult[]> {
    return this.withFailover((service) => service.search(query));
  }

  private async withFailover<T>(
    operation: (service: BaseFinanceService) => Promise<T>
  ): Promise<T> {
    const initialSource = this.getCurrentSource();
    let attempts = 0;
    const maxAttempts = this.dataSources.length;

    while (attempts < maxAttempts) {
      const currentSource = this.getCurrentSource();
      const service = FinanceServiceFactory.getInstance(currentSource);

      try {
        const result = await operation(service);
        this.recordSuccess(currentSource);
        return result;
      } catch (error) {
        console.error(`Error with data source ${currentSource}:`, error);
        this.recordFailure(currentSource);
        
        // 如果不是最后一次尝试，切换到下一个数据源
        if (attempts < maxAttempts - 1) {
          this.switchToNextSource();
        }
        attempts++;
      }
    }

    // 如果所有数据源都失败了，恢复到初始数据源并抛出错误
    this.currentSourceIndex = this.dataSources.indexOf(initialSource);
    throw new Error('All data sources failed');
  }

  private getCurrentSource(): DataSource {
    return this.dataSources[this.currentSourceIndex];
  }

  private switchToNextSource() {
    this.currentSourceIndex = (this.currentSourceIndex + 1) % this.dataSources.length;
    const newSource = this.getCurrentSource();
    console.log(`Switching to data source: ${newSource}`);
  }

  private recordFailure(source: DataSource) {
    const currentFailures = this.failureCount.get(source) || 0;
    this.failureCount.set(source, currentFailures + 1);

    // 设置重置定时器
    if (this.failureTimeouts.has(source)) {
      clearTimeout(this.failureTimeouts.get(source)!);
    }
    const timeout = setTimeout(() => {
      this.failureCount.delete(source);
      this.failureTimeouts.delete(source);
    }, this.failureResetInterval);
    this.failureTimeouts.set(source, timeout);

    // 如果失败次数达到阈值，切换数据源
    if (currentFailures + 1 >= this.maxFailures) {
      this.switchToNextSource();
      this.failureCount.delete(source);
    }
  }

  private recordSuccess(source: DataSource) {
    // 成功后重置失败计数
    this.failureCount.delete(source);
    if (this.failureTimeouts.has(source)) {
      clearTimeout(this.failureTimeouts.get(source)!);
      this.failureTimeouts.delete(source);
    }
  }
} 