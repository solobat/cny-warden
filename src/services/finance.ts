import { BaseFinanceService } from './base';
import { EastMoneyFinanceService } from './eastmoney';
import { ThsFinanceService } from './ths';
import { SecurityInfo, PriceData, SearchResult } from './types';

export class FinanceService {
  private services: BaseFinanceService[];

  constructor() {
    this.services = [
      new ThsFinanceService(),
      new EastMoneyFinanceService()
    ];
  }

  async fetchSecurityInfo(code: string): Promise<SecurityInfo> {
    const thsService = this.services[0];
    try {
      const info = await thsService.getSecurityInfo(code);
      if (info) {
        return info;
      }
    } catch (error) {
      console.error('Failed to fetch security info from ThsFinanceService:', error);
    }

    for (let i = 1; i < this.services.length; i++) {
      try {
        const info = await this.services[i].getSecurityInfo(code);
        if (info) {
          return info;
        }
      } catch (error) {
        console.error(`Failed to fetch security info from ${this.services[i].constructor.name}:`, error);
      }
    }
    throw new Error('Failed to fetch security info from all services');
  }

  async fetchPriceData(code: string): Promise<PriceData> {
    const thsService = this.services[0];
    try {
      const data = await thsService.getPriceData(code);
      if (data) {
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch price data from ThsFinanceService:', error);
    }

    for (let i = 1; i < this.services.length; i++) {
      try {
        const data = await this.services[i].getPriceData(code);
        if (data) {
          return data;
        }
      } catch (error) {
        console.error(`Failed to fetch price data from ${this.services[i].constructor.name}:`, error);
      }
    }
    throw new Error('Failed to fetch price data from all services');
  }

  async searchSecurities(query: string): Promise<SearchResult[]> {
    const results = new Map<string, SearchResult>();
    
    const thsService = this.services[0];
    try {
      const items = await thsService.search(query);
      for (const item of items) {
        if (!results.has(item.code)) {
          results.set(item.code, item);
        }
      }
    } catch (error) {
      console.error('Failed to search securities from ThsFinanceService:', error);
    }

    for (let i = 1; i < this.services.length; i++) {
      try {
        const items = await this.services[i].search(query);
        for (const item of items) {
          if (!results.has(item.code)) {
            results.set(item.code, item);
          }
        }
      } catch (error) {
        console.error(`Failed to search securities from ${this.services[i].constructor.name}:`, error);
      }
    }
    
    return Array.from(results.values());
  }
} 