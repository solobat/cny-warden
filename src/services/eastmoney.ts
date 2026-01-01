import { BaseFinanceService } from './base';
import { SecurityInfo, PriceData, SearchResult, SecurityType } from './types';

export class EastMoneyFinanceService extends BaseFinanceService {
  private readonly quoteApi = 'https://push2.eastmoney.com/api/qt/stock/get';
  private readonly etfQuoteApi = 'https://push2.eastmoney.com/api/qt/stock/get';  // ETF 使用相同的接口，但字段不同
  private readonly searchApi = 'https://searchapi.eastmoney.com/api/suggest/get';
  private readonly sectorApi = 'https://push2.eastmoney.com/api/qt/stock/fflow/kline/get';
  
  // 价格映射表
  private readonly priceMap: Record<string, number> = {
    '510300': 4.32,  // 沪深300ETF
    '510050': 2.8,  // 上证50ETF
    '515170': 0.591, // 食品饮料ETF
    '006705': 1.5702, // MSCI C
    '015040': 0.8081, // 食品饮料
    '110003': 2.0111, // 上证 50 A
    '501011': 1.1747, // 中药 A
    '000307': 708,   // 黄金ETF,
    '518800': 7.413
  };

  private readonly typeTextMap: Record<SecurityType, string> = {
    'stock': '股票',
    'etf': 'ETF',
    'fund': '基金',
    'bond': '债券',
    'gold': '黄金',
    'cash': '现金'
  };

  // 检查标的是否已存在
  private isSecurityExists(code: string): boolean {
    return code in this.priceMap;
  }

  // 添加新的标的
  public addSecurity(code: string, price: number): void {
    if (this.isSecurityExists(code)) {
      const type = this.determineType(code);
      console.warn(`⚠️ ${this.typeTextMap[type]} ${code} 已存在，当前价格为 ${this.priceMap[code]}，请勿重复添加`);
      return;
    }
    this.priceMap[code] = price;
    const type = this.determineType(code);
    console.log(`✅ 已添加${this.typeTextMap[type]} ${code}，价格为 ${price}`);
  }

  private async getSectorAndIndustry(code: string): Promise<{ sector: string; industry: string }> {
    const { market, pureCode } = this.parseStockCode(code);
    const fullCode = this.getFullCode(market, pureCode);
    
    try {
      const response = await fetch(
        `https://push2.eastmoney.com/api/qt/stock/get?secid=${fullCode}&fields=f127,f128,f129,f130,f131,f132,f133,f134,f135,f136,f137,f138,f139,f140,f141,f142,f143,f144,f145,f146,f147,f148,f149,f150`,
        {
          headers: {
            'Referer': 'https://quote.eastmoney.com'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Sector API Response:', data);
      
      if (!data || !data.data) {
        return { sector: '', industry: '' };
      }
      
      // 从返回的数据中提取板块和行业信息
      const sector = data.data.f127 || data.data.f129 || data.data.f131 || '';
      const industry = data.data.f128 || data.data.f130 || data.data.f132 || '';
      
      return { sector, industry };
    } catch (error) {
      console.error('Failed to fetch sector info:', error);
      return { sector: '', industry: '' };
    }
  }

  protected async fetchSecurityInfo(code: string): Promise<SecurityInfo> {
    const { market, pureCode } = this.parseStockCode(code);
    const fullCode = this.getFullCode(market, pureCode);
    
    try {
      // 首先获取板块和行业信息
      console.log('Fetching sector info for:', code);
      const { sector, industry } = await this.getSectorAndIndustry(code);
      console.log('Got sector info:', { sector, industry });

      // 然后获取其他证券信息
      const response = await fetch(`${this.quoteApi}?fields=f57,f58,f43,f169,f170,f46,f44,f45,f168,f47,f60&secid=${fullCode}`, {
        headers: {
          'Referer': 'https://quote.eastmoney.com'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Security Info API Response:', data);
      
      if (!data || !data.data) {
        throw new Error('Invalid response format');
      }
      
      const quote = data.data;
      
      return {
        code: pureCode,
        name: quote.f58,
        type: this.determineType(code),
        currentPrice: parseFloat(quote.f43) / 100,
        lastUpdate: new Date(),
        market: market as 'sh' | 'sz' | 'hk',
        sector,
        industry
      };
    } catch (error) {
      console.error('Failed to fetch security info:', error);
      throw error;
    }
  }

  protected async fetchPriceData(code: string): Promise<PriceData> {
    const { market, pureCode } = this.parseStockCode(code);
    const fullCode = this.getFullCode(market, pureCode);
    const type = this.determineType(code);
    
    try {
      if (this.isSecurityExists(pureCode)) {
        // 使用固定价格
        const fixedPrice = this.priceMap[pureCode];
        const timestamp = new Date();
        
        return {
          code: pureCode,
          price: fixedPrice,
          change: 0,
          changePercent: 0,
          high: fixedPrice,
          low: fixedPrice,
          open: fixedPrice,
          lastClose: fixedPrice,
          volume: 0,
          amount: 0,
          timestamp
        };
      } else {
        // 使用 API 获取实时价格
        const url = `${this.quoteApi}?fields=f57,f58,f43,f169,f170,f46,f44,f45,f168,f47,f60,f48&secid=${fullCode}`;
        
        const response = await fetch(url, {
          headers: {
            'Referer': 'https://quote.eastmoney.com',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data || !data.data) {
          console.error('API Response:', data);
          throw new Error('Invalid response format');
        }
        
        const quote = data.data;
        console.log('Quote data:', quote);
        
        return {
          code: pureCode,
          price: parseFloat(quote.f43) / 100,
          change: parseFloat(quote.f60) ? (parseFloat(quote.f43) - parseFloat(quote.f60)) / 100 : 0,
          changePercent: parseFloat(quote.f60) ? ((parseFloat(quote.f43) - parseFloat(quote.f60)) / parseFloat(quote.f60)) * 100 : 0,
          high: parseFloat(quote.f44) / 100 || 0,
          low: parseFloat(quote.f45) / 100 || 0,
          open: parseFloat(quote.f46) / 100 || 0,
          lastClose: parseFloat(quote.f60) / 100 || 0,
          volume: parseInt(quote.f47) * 100 || 0,
          amount: parseFloat(quote.f48) * 10000 || 0,
          timestamp: new Date()
        };
      }
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
        `${this.searchApi}?cb=jQuery&input=${encodeURIComponent(query)}&token=D43BF40C&type=14`,
        {
          headers: {
            'Referer': 'https://quote.eastmoney.com'
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

      const jsonStr = text.replace(/^jQuery\((.*)\)$/, '$1');
      const data = JSON.parse(jsonStr);
      console.log('Search API Response:', data);
      
      if (!data || !data.QuotationCodeTable || !Array.isArray(data.QuotationCodeTable.Data)) {
        return [];
      }
      
      // 获取搜索结果中的证券代码
      const codes = data.QuotationCodeTable.Data
        .filter((item: any) => item && item.Code)
        .map((item: any) => item.Code);
      
      // 批量获取板块和行业信息
      const sectorInfoPromises = codes.map((code: string) => this.getSectorAndIndustry(code));
      const sectorInfos = await Promise.all(sectorInfoPromises);
      
      return data.QuotationCodeTable.Data
        .filter((item: any) => item && item.Code && item.Name)
        .map((item: any, index: number) => {
          const { market } = this.parseStockCode(item.Code);
          return {
            code: item.Code,
            name: item.Name,
            type: this.determineType(item.Code),
            market: market,
            sector: sectorInfos[index]?.sector || '',
            industry: sectorInfos[index]?.industry || ''
          };
        });
    } catch (error) {
      console.error('Failed to search securities:', error);
      return [];
    }
  }

  private getFullCode(market: string, code: string): string {
    if (market === 'sh') return `1.${code}`;
    if (market === 'sz') return `0.${code}`;
    if (market === 'hk') return `116.${code}`;
    return code;
  }

  private determineType(code: string): SecurityType {
    // 黄金代码规则
    if (code.startsWith('000307')) {
      return 'gold';
    }
    
    // 基金代码规则
    if (
      (code.startsWith('00') && !code.startsWith('000')) || // 排除 000 开头的股票
      code.startsWith('15') || 
      code.startsWith('16') || 
      code.startsWith('50') ||
      code.startsWith('11') ||
      code.startsWith('015')
    ) {
      return 'fund';
    }
    
    // ETF代码规则
    if (code.startsWith('51') || code.startsWith('588') || code.startsWith('159')) {
      return 'etf';
    }
    
    // 股票代码规则
    if (
      code.startsWith('600') || 
      code.startsWith('601') || 
      code.startsWith('603') || 
      code.startsWith('688') || // 科创板
      code.startsWith('000') || // 深圳主板
      code.startsWith('002') || // 中小板
      code.startsWith('003') || // 中小板
      code.startsWith('300')    // 创业板
    ) {
      return 'stock';
    }
    
    // 默认处理为股票
    return 'stock';
  }
} 