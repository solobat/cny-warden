import { BaseFinanceService } from './base';
import { SecurityInfo, PriceData, SearchResult, SecurityType } from './types';

export class ThsFinanceService extends BaseFinanceService {
  private readonly quoteApi = 'https://d.10jqka.com.cn/v6/line/';
  private readonly searchApi = 'https://search.10jqka.com.cn/stock/search/';

  protected async fetchSecurityInfo(code: string): Promise<SecurityInfo> {
    const { market, pureCode } = this.parseStockCode(code);
    const fullCode = this.getFullCode(market, pureCode);
    
    try {
      const response = await fetch(`${this.quoteApi}${fullCode}/all.js`, {
        headers: {
          'Referer': 'https://www.10jqka.com.cn',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      const data = JSON.parse(text.replace(/^.*?\(/, '').replace(/\)$/, ''));
      
      if (!data || !data.data) {
        throw new Error('Invalid response format');
      }
      
      const quote = data.data;
      
      return {
        code: pureCode,
        name: quote.name,
        type: this.determineType(code),
        currentPrice: parseFloat(quote.price),
        lastUpdate: new Date(),
        market: market as 'sh' | 'sz' | 'hk',
        sector: '',
        industry: ''
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
      const response = await fetch(`${this.quoteApi}${fullCode}/all.js`, {
        headers: {
          'Referer': 'https://www.10jqka.com.cn',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      const data = JSON.parse(text.replace(/^.*?\(/, '').replace(/\)$/, ''));
      
      if (!data || !data.data) {
        throw new Error('Invalid response format');
      }
      
      const quote = data.data;
      
      return {
        code: pureCode,
        price: parseFloat(quote.price),
        change: parseFloat(quote.change),
        changePercent: parseFloat(quote.changePercent),
        high: parseFloat(quote.high),
        low: parseFloat(quote.low),
        open: parseFloat(quote.open),
        lastClose: parseFloat(quote.preClose),
        volume: parseInt(quote.volume),
        amount: parseFloat(quote.amount),
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
        `${this.searchApi}?keyword=${encodeURIComponent(query)}&type=stock,fund,etf,bond&page=1&perpage=20`,
        {
          headers: {
            'Referer': 'https://www.10jqka.com.cn',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site'
          },
          referrerPolicy: 'strict-origin-when-cross-origin',
          mode: 'cors',
          credentials: 'omit'
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.data || !Array.isArray(data.data)) {
        return [];
      }
      
      return data.data
        .filter((item: any) => item && item.code && item.name)
        .map((item: any) => {
          const { market } = this.parseStockCode(item.code);
          return {
            code: item.code,
            name: item.name,
            type: this.determineType(item.code),
            market: market,
            sector: '',
            industry: ''
          };
        });
    } catch (error) {
      console.error('Failed to search securities:', error);
      return [];
    }
  }

  private getFullCode(market: string, code: string): string {
    if (market === 'sh') return `1${code}`;
    if (market === 'sz') return `0${code}`;
    if (market === 'hk') return `116${code}`;
    return code;
  }

  private determineType(code: string): SecurityType {
    if (!code) {
      return 'stock';
    }
    
    if (code.startsWith('51') || code.startsWith('588')) {
      return 'etf';
    }
    if (code.startsWith('11') || code.startsWith('12')) {
      return 'bond';
    }
    if (code.startsWith('16') || code.startsWith('50')) {
      return 'fund';
    }
    return 'stock';
  }
} 