import { SecurityType } from '../services/types';

export interface Investment {
  id: string;
  code: string;
  name: string;
  type: SecurityType;
  amount: number;
  targetPercentage: number;
  currentPrice?: number;
  lastUpdate?: Date;
  sector?: string;  // 所属板块
  industry?: string;  // 所属行业
} 