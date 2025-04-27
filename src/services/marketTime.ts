export class MarketTimeService {
  private static instance: MarketTimeService;
  private readonly marketOpenTime = '09:30';
  private readonly marketCloseTime = '15:00';
  private readonly lunchBreakStart = '11:30';
  private readonly lunchBreakEnd = '13:00';

  private constructor() {}

  static getInstance(): MarketTimeService {
    if (!MarketTimeService.instance) {
      MarketTimeService.instance = new MarketTimeService();
    }
    return MarketTimeService.instance;
  }

  isMarketOpen(): boolean {
    const now = new Date();
    const currentTime = this.formatTime(now);
    const dayOfWeek = now.getDay();

    // 周末休市
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    // 检查是否在交易时间内
    if (currentTime >= this.marketOpenTime && currentTime <= this.marketCloseTime) {
      // 检查是否在午休时间
      if (currentTime >= this.lunchBreakStart && currentTime <= this.lunchBreakEnd) {
        return false;
      }
      return true;
    }

    return false;
  }

  getNextUpdateInterval(): number {
    const now = new Date();
    const currentTime = this.formatTime(now);
    const dayOfWeek = now.getDay();

    // 如果是周末，返回到下周一开盘的时间
    if (dayOfWeek === 0) {
      return this.getMillisecondsUntilNextDay(1, this.marketOpenTime);
    }
    if (dayOfWeek === 6) {
      return this.getMillisecondsUntilNextDay(2, this.marketOpenTime);
    }

    // 如果已经收盘，返回到明天开盘的时间
    if (currentTime >= this.marketCloseTime) {
      return this.getMillisecondsUntilNextDay(1, this.marketOpenTime);
    }

    // 如果在午休时间，返回到午休结束的时间
    if (currentTime >= this.lunchBreakStart && currentTime <= this.lunchBreakEnd) {
      return this.getMillisecondsUntilTime(this.lunchBreakEnd);
    }

    // 如果还没开盘，返回到开盘时间
    if (currentTime < this.marketOpenTime) {
      return this.getMillisecondsUntilTime(this.marketOpenTime);
    }

    // 正常交易时间，5分钟更新一次
    return 5 * 60 * 1000;
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private getMillisecondsUntilTime(targetTime: string): number {
    const now = new Date();
    const [targetHours, targetMinutes] = targetTime.split(':').map(Number);
    const targetDate = new Date(now);
    targetDate.setHours(targetHours, targetMinutes, 0, 0);
    
    if (targetDate <= now) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    return targetDate.getTime() - now.getTime();
  }

  private getMillisecondsUntilNextDay(daysToAdd: number, targetTime: string): number {
    const now = new Date();
    const [targetHours, targetMinutes] = targetTime.split(':').map(Number);
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    targetDate.setHours(targetHours, targetMinutes, 0, 0);
    return targetDate.getTime() - now.getTime();
  }
} 