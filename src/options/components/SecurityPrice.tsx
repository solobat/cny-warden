import React, { useEffect, useState } from 'react';
import { FinanceServiceFactory } from '../../services/factory';
import { PriceData } from '../../services/types';
import { useConfigStore } from '../../store/configStore';
import { useInvestmentStore } from '../../store';

interface SecurityPriceProps {
  code: string;
  name: string;
  id: string;
}

export const SecurityPrice: React.FC<SecurityPriceProps> = ({ code, name, id }) => {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { defaultSource } = useConfigStore();
  const { updateInvestment } = useInvestmentStore();

  const fetchPrice = async () => {
    setLoading(true);
    setError(null);
    try {
      const service = FinanceServiceFactory.getInstance(defaultSource);
      const data = await service.getPriceData(code);
      setPriceData(data);
      // 更新投资记录中的价格
      updateInvestment(id, {
        currentPrice: data.price,
        lastUpdate: data.timestamp
      });
    } catch (err) {
      console.error('Failed to fetch price:', err);
      setError(`获取价格失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
    // 每30秒更新一次价格
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [code, defaultSource, id]);

  if (loading && !priceData) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-24"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm">
        <div>{code}: {error}</div>
        <button
          onClick={fetchPrice}
          className="mt-1 text-blue-400 hover:text-blue-300"
        >
          重试
        </button>
      </div>
    );
  }

  if (!priceData) {
    return null;
  }

  const { price, changePercent } = priceData;
  const isPositive = changePercent > 0;
  const color = isPositive ? 'text-red-400' : 'text-green-400';

  return (
    <div>
      <div className="text-gray-200">{name}</div>
      <div className="text-sm">
        <span className="text-gray-400">{code}</span>
        <span className="mx-2">|</span>
        <span className={color}>
          ¥{price.toFixed(2)} ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}; 