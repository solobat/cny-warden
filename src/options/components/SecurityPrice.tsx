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
  const { updateInvestment, investments } = useInvestmentStore();
  
  // 获取投资信息以确定类型
  const investment = investments.find(inv => inv.id === id);

  const fetchPrice = async () => {
    // 现金类型不需要获取价格，直接设置为1
    if (investment?.type === 'cash') {
      const cashPriceData = {
        price: 1,
        change: 0,
        changePercent: 0,
        high: 1,
        low: 1,
        open: 1,
        lastClose: 1,
        volume: 0,
        amount: 0,
        timestamp: new Date()
      } as PriceData;
      
      setPriceData(cashPriceData);
      updateInvestment(id, {
        currentPrice: 1,
        lastUpdate: new Date()
      });
      return;
    }

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
    // 现金类型不需要定时更新，其他类型每30秒更新一次
    if (investment?.type === 'cash') {
      return;
    }
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [code, defaultSource, id, investment?.type]);

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
  
  // 现金类型特殊显示
  if (investment?.type === 'cash') {
    return (
      <div>
        <div className="text-gray-200">{name}</div>
        <div className="text-sm">
          <span className="text-gray-400">{code}</span>
          <span className="mx-2">|</span>
          <span className="text-blue-400">
            ¥{price.toFixed(2)} (现金)
          </span>
        </div>
      </div>
    );
  }
  
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