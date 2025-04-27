import { Investment } from '../store';

export interface PriceChangeNotification {
  investment: Investment;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
}

export class NotificationService {
  private static instance: NotificationService;
  private readonly notificationThreshold = 1; // 价格变化超过1%时发送通知
  private readonly notificationTimeout = 30 * 60 * 1000; // 30分钟内不重复发送同一标的的通知

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async sendPriceChangeNotification(notification: PriceChangeNotification) {
    const { investment, oldPrice, newPrice, changePercent } = notification;
    
    // 检查变化是否超过阈值
    if (Math.abs(changePercent) < this.notificationThreshold) {
      return;
    }

    // 创建通知
    const title = `${investment.name} (${investment.code})`;
    const message = this.formatMessage(oldPrice, newPrice, changePercent);
    
    try {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title,
        message,
        priority: 2
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  private formatMessage(oldPrice: number, newPrice: number, changePercent: number): string {
    const direction = changePercent > 0 ? '上涨' : '下跌';
    const change = Math.abs(changePercent).toFixed(2);
    const oldPriceStr = oldPrice.toFixed(2);
    const newPriceStr = newPrice.toFixed(2);
    
    return `${direction}${change}%\n${oldPriceStr} → ${newPriceStr}`;
  }
} 