export type SecurityType = 'stock' | 'fund' | 'etf' | 'bond' | 'gold' | 'cash';

export interface SecurityInfo {
  code: string;
  name: string;
  type: SecurityType;
  currentPrice?: number;
  lastUpdate?: Date;
  market?: 'sh' | 'sz' | 'hk'; // 上海、深圳、香港
  sector?: string; // 所属板块
  industry?: string; // 所属行业
}

export interface PriceData {
  code: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  lastClose: number;
  volume: number;
  amount: number;
  timestamp: Date;
}

export interface SearchResult {
  code: string;
  name: string;
  type: SecurityType;
  market: string; // 市场代码，如 'sh'、'sz'、'hk'、'unknown'
  sector?: string; // 所属板块
  industry?: string; // 所属行业
} 