import { FinanceServiceFactory } from './factory';
import { useInvestmentStore } from '../store';
import { MarketTimeService } from './marketTime';
import { NotificationService, PriceChangeNotification } from './notification';

export class PriceUpdater {
  private static instance: PriceUpdater;
  private timer: NodeJS.Timeout | null = null;
  private isUpdating = false;
  private marketTimeService: MarketTimeService;
  private notificationService: NotificationService;

  private constructor() {
    this.marketTimeService = MarketTimeService.getInstance();
    this.notificationService = NotificationService.getInstance();
  }

  static getInstance(): PriceUpdater {
    if (!PriceUpdater.instance) {
      PriceUpdater.instance = new PriceUpdater();
    }
    return PriceUpdater.instance;
  }

  start() {
    if (this.timer) {
      return; // 已经在运行
    }

    // 立即执行一次更新
    this.updatePrices();

    // 设置定时器
    this.scheduleNextUpdate();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private scheduleNextUpdate() {
    const interval = this.marketTimeService.getNextUpdateInterval();
    this.timer = setTimeout(() => {
      if (this.marketTimeService.isMarketOpen()) {
        this.updatePrices();
      }
      this.scheduleNextUpdate();
    }, interval);
  }

  private async updatePrices() {
    if (this.isUpdating) {
      return; // 防止重复更新
    }

    try {
      this.isUpdating = true;
      const store = useInvestmentStore.getState();
      const financeService = FinanceServiceFactory.getInstance();

      // 获取所有需要更新的标的
      const investments = store.investments.filter(inv => inv.code);
      
      // 批量更新价格
      await Promise.all(investments.map(async (investment) => {
        try {
          let priceData;
          
          // 现金类型特殊处理，价格始终为1
          if (investment.type === 'cash') {
            priceData = {
              price: 1,
              timestamp: new Date()
            } as any;
          } else {
            priceData = await financeService.getPriceData(investment.code);
          }
          
          const oldPrice = investment.currentPrice;
          
          // 更新价格
          store.updateInvestment(investment.id, {
            currentPrice: priceData.price,
            lastUpdate: priceData.timestamp
          });

          // 如果价格发生变化，发送通知（现金类型不发送通知）
          if (oldPrice && oldPrice !== priceData.price && investment.type !== 'cash') {
            const changePercent = ((priceData.price - oldPrice) / oldPrice) * 100;
            const notification: PriceChangeNotification = {
              investment,
              oldPrice,
              newPrice: priceData.price,
              changePercent
            };
            await this.notificationService.sendPriceChangeNotification(notification);
          }
        } catch (error) {
          console.error(`Failed to update price for ${investment.code}:`, error);
        }
      }));
    } catch (error) {
      console.error('Failed to update prices:', error);
    } finally {
      this.isUpdating = false;
    }
  }
} 