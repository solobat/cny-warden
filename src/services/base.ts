import { SecurityInfo, PriceData, SearchResult } from './types';

export abstract class BaseFinanceService {
  protected cache: Map<string, SecurityInfo> = new Map();
  protected priceCache: Map<string, PriceData> = new Map();
  protected cacheTimeout = 5 * 60 * 1000; // 5分钟缓存

  protected abstract fetchSecurityInfo(code: string): Promise<SecurityInfo>;
  protected abstract fetchPriceData(code: string): Promise<PriceData>;
  protected abstract searchSecurities(query: string): Promise<SearchResult[]>;

  public async getSecurityInfo(code: string): Promise<SecurityInfo> {
    const cached = this.cache.get(code);
    if (cached && cached.lastUpdate && 
        Date.now() - cached.lastUpdate.getTime() < this.cacheTimeout) {
      return cached;
    }

    const info = await this.fetchSecurityInfo(code);
    this.cache.set(code, info);
    return info;
  }

  public async getPriceData(code: string): Promise<PriceData> {
    const cached = this.priceCache.get(code);
    if (cached && cached.timestamp && 
        Date.now() - cached.timestamp.getTime() < this.cacheTimeout) {
      return cached;
    }

    const priceData = await this.fetchPriceData(code);
    this.priceCache.set(code, priceData);
    return priceData;
  }

  public async search(query: string): Promise<SearchResult[]> {
    return this.searchSecurities(query);
  }

  protected parseStockCode(code: string): { market: string, pureCode: string } {
    if (code.startsWith('6')) {
      return { market: 'sh', pureCode: code };
    } else if (code.startsWith('0') || code.startsWith('3')) {
      return { market: 'sz', pureCode: code };
    } else if (code.startsWith('hk')) {
      return { market: 'hk', pureCode: code.slice(2) };
    }
    return { market: '', pureCode: code };
  }
} 