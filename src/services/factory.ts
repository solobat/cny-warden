import { BaseFinanceService } from './base';
import { SinaFinanceService } from './sina';
import { EastMoneyFinanceService } from './eastmoney';
import { ThsFinanceService } from './ths';
import { FailoverFinanceService } from './failover';

export type DataSource = 'sina' | 'eastmoney' | 'ths' | 'failover';

export class FinanceServiceFactory {
  private static instances: Map<DataSource, BaseFinanceService> = new Map();
  private static defaultSource: DataSource = 'eastmoney';  // 默认使用东方财富

  static setDefaultSource(source: DataSource) {
    FinanceServiceFactory.defaultSource = source;
  }

  static getInstance(source?: DataSource): BaseFinanceService {
    const targetSource = source || FinanceServiceFactory.defaultSource;
    
    if (!FinanceServiceFactory.instances.has(targetSource)) {
      let service: BaseFinanceService;
      
      switch (targetSource) {
        case 'sina':
          service = new SinaFinanceService();
          break;
        case 'eastmoney':
          service = new EastMoneyFinanceService();
          break;
        case 'ths':
          service = new ThsFinanceService();
          break;
        case 'failover':
          service = new FailoverFinanceService();
          break;
        default:
          service = new EastMoneyFinanceService();  // 默认使用东方财富
      }
      
      FinanceServiceFactory.instances.set(targetSource, service);
    }
    
    return FinanceServiceFactory.instances.get(targetSource)!;
  }
} 