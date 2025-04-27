import { BaseFinanceService } from './base';
import { SecurityInfo, PriceData, SearchResult, SecurityType } from './types';

export class SinaFinanceService extends BaseFinanceService {
  private readonly baseUrl = 'http://hq.sinajs.cn/list=';
  private readonly searchUrl = 'https://suggest3.sinajs.cn/suggest/type=111&key=';

  protected async fetchSecurityInfo(code: string): Promise<SecurityInfo> {
    const { market, pureCode } = this.parseStockCode(code);
    const fullCode = this.getFullCode(market, pureCode);
    
    try {
      const response = await fetch(`${this.baseUrl}${fullCode}`, {
        headers: {
          'Referer': 'https://finance.sina.com.cn'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response');
      }
      
      const data = this.parseResponse(text);
      if (!data || !data.name) {
        throw new Error('Invalid security data');
      }
      
      return {
        code: pureCode,
        name: data.name,
        type: this.determineType(code),
        currentPrice: data.price,
        lastUpdate: new Date(),
        market: market as 'sh' | 'sz' | 'hk'
      };
    } catch (error) {
      console.error('Failed to fetch security info:', error);
      throw error;
    }
  }

  protected async fetchPriceData(code: string): Promise<PriceData> {
    const { market, pureCode } = this.parseStockCode(code);
    const fullCode = this.getFullCode(market, pureCode);
    
    try {
      const response = await fetch(`${this.baseUrl}${fullCode}`, {
        headers: {
          'Referer': 'https://finance.sina.com.cn'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response');
      }
      
      const data = this.parseResponse(text);
      if (!data || isNaN(data.price) || isNaN(data.lastClose)) {
        throw new Error('Invalid price data');
      }
      
      return {
        code: pureCode,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        high: data.high,
        low: data.low,
        open: data.open,
        lastClose: data.lastClose,
        volume: data.volume,
        amount: data.amount,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to fetch price data:', error);
      throw error;
    }
  }

  protected async searchSecurities(query: string): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const response = await fetch(
        `${this.searchUrl}${encodeURIComponent(query)}`,
        {
          headers: {
            'Referer': 'https://finance.sina.com.cn'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        return [];
      }
      
      return this.parseSearchResponse(text);
    } catch (error) {
      console.error('Failed to search securities:', error);
      return [];
    }
  }

  private getFullCode(market: string, code: string): string {
    if (!code) {
      throw new Error('Empty security code');
    }
    if (market === 'sh') return `sh${code}`;
    if (market === 'sz') return `sz${code}`;
    if (market === 'hk') return `hk${code}`;
    return code;
  }

  private determineType(code: string): SecurityType {
    if (!code) {
      return 'stock';
    }
    
    if (code.startsWith('6') || code.startsWith('0') || code.startsWith('3')) {
      return 'stock';
    }
    if (code.startsWith('hk')) {
      return 'stock';
    }
    // 默认返回股票类型，因为新浪财经主要提供股票数据
    return 'stock';
  }

  private parseResponse(text: string): any {
    const match = text.match(/="(.+)"/);
    if (!match) {
      throw new Error('Invalid response format');
    }
    
    const data = match[1].split(',');
    if (data.length < 10) {
      throw new Error('Insufficient data fields');
    }
    
    const price = parseFloat(data[3]);
    const lastClose = parseFloat(data[2]);
    
    if (isNaN(price) || isNaN(lastClose)) {
      throw new Error('Invalid price data');
    }
    
    return {
      name: data[0],
      open: parseFloat(data[1]),
      lastClose,
      price,
      high: parseFloat(data[4]),
      low: parseFloat(data[5]),
      volume: parseInt(data[8]),
      amount: parseFloat(data[9]),
      change: price - lastClose,
      changePercent: ((price - lastClose) / lastClose) * 100
    };
  }

  private parseSearchResponse(text: string): SearchResult[] {
    const match = text.match(/="(.+)"/);
    if (!match) return [];
    
    const data = match[1].split(';');
    return data
      .filter(item => item && item.includes(','))
      .map(item => {
        const [code, name] = item.split(',');
        if (!code || !name) {
          return undefined;
        }
        const { market } = this.parseStockCode(code);
        return {
          code,
          name,
          type: this.determineType(code),
          market: market || 'unknown'
        };
      })
      .filter((item): item is SearchResult => item !== undefined);
  }
} 