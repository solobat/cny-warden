import React, { useEffect, useState } from 'react';
import { useInvestmentStore } from '../../store/index';
import { useConfigStore } from '../../store/configStore';
import { SecuritySearch } from './SecuritySearch';
import { SecurityPrice } from './SecurityPrice';
import { DataImportExport } from './DataImportExport';
import { SearchResult } from '../../services/types';

const getSecurityTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'stock': '股票',
    'fund': '基金',
    'etf': 'ETF',
    'bond': '债券',
    'gold': '黄金',
    'cash': '现金'
  };
  return typeMap[type] || type;
};

type FilterStatus = 'all' | 'over' | 'under' | 'normal';

export const Portfolio: React.FC = () => {
  const { investments, addInvestment, removeInvestment, updateInvestment, loadInvestments } = useInvestmentStore();
  const { loadConfig } = useConfigStore();
  const [isEditing, setIsEditing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useEffect(() => {
    loadInvestments();
    loadConfig();
  }, [loadInvestments]);

  const handleAddSecurity = (security: SearchResult) => {
    addInvestment({
      code: security.code,
      name: security.name,
      type: security.type,
      amount: 0,
      targetPercentage: 0,
      currentPrice: 0,
      lastUpdate: new Date(),
      sector: security.sector,
      industry: security.industry
    });
  };

  const handleAdjustTargetPercentages = () => {
    const totalTarget = investments.reduce((sum, inv) => sum + inv.targetPercentage, 0);
    if (totalTarget === 0) return;

    investments.forEach(investment => {
      const adjustedPercentage = (investment.targetPercentage / totalTarget) * 100;
      updateInvestment(investment.id, { targetPercentage: Number(adjustedPercentage.toFixed(2)) });
    });
  };

  const totalValue = investments.reduce((sum, inv) => {
    // 现金类型特殊处理，价格始终为1
    const price = inv.type === 'cash' ? 1 : (inv.currentPrice || 0);
    return sum + price * inv.amount;
  }, 0);

  // 计算大类资产统计
  const assetTypeStats = investments.reduce((stats, inv) => {
    const type = inv.type;
    // 现金类型特殊处理，价格始终为1
    const price = inv.type === 'cash' ? 1 : (inv.currentPrice || 0);
    const value = price * inv.amount;
    if (!stats[type]) {
      stats[type] = { value: 0, count: 0 };
    }
    stats[type].value += value;
    stats[type].count += 1;
    return stats;
  }, {} as Record<string, { value: number; count: number }>);

  // 计算板块统计
  const sectorStats = investments.reduce((stats, inv) => {
    if (!inv.sector) return stats;
    const sector = inv.sector;
    // 现金类型特殊处理，价格始终为1
    const price = inv.type === 'cash' ? 1 : (inv.currentPrice || 0);
    const value = price * inv.amount;
    if (!stats[sector]) {
      stats[sector] = { value: 0, count: 0 };
    }
    stats[sector].value += value;
    stats[sector].count += 1;
    return stats;
  }, {} as Record<string, { value: number; count: number }>);

  // 计算行业统计
  const industryStats = investments.reduce((stats, inv) => {
    if (!inv.industry) return stats;
    const industry = inv.industry;
    // 现金类型特殊处理，价格始终为1
    const price = inv.type === 'cash' ? 1 : (inv.currentPrice || 0);
    const value = price * inv.amount;
    if (!stats[industry]) {
      stats[industry] = { value: 0, count: 0 };
    }
    stats[industry].value += value;
    stats[industry].count += 1;
    return stats;
  }, {} as Record<string, { value: number; count: number }>);

  // 筛选投资列表
  const filteredInvestments = investments.filter(investment => {
    // 现金类型特殊处理，价格始终为1
    const price = investment.type === 'cash' ? 1 : (investment.currentPrice || 0);
    if (!price || totalValue === 0) return true;
    const actualPercentage = (price * investment.amount / totalValue) * 100;
    
    switch (filterStatus) {
      case 'over':
        return actualPercentage > investment.targetPercentage * 1.2;
      case 'under':
        return actualPercentage < investment.targetPercentage * 0.8;
      case 'normal':
        return actualPercentage >= investment.targetPercentage * 0.8 && 
               actualPercentage <= investment.targetPercentage * 1.2;
      default:
        return true;
    }
  });

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-[2560px] w-full mx-auto px-2">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* 左侧栏 */}
          <div className="xl:col-span-2 space-y-4">
            {/* 添加新标的 */}
            <div className="bg-gray-800 rounded border border-gray-700 p-3">
              <h2 className="text-xl font-bold mb-3 text-gray-100">添加新标的</h2>
              <SecuritySearch onSelect={handleAddSecurity} />
              
              {/* 添加现金按钮 */}
              <div className="mt-3 pt-3 border-t border-gray-700">
                <button
                  onClick={() => {
                    addInvestment({
                      code: 'CASH',
                      name: '现金',
                      type: 'cash',
                      amount: 0,
                      targetPercentage: 0,
                      currentPrice: 1,
                      lastUpdate: new Date(),
                      sector: '现金',
                      industry: '现金'
                    });
                  }}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded border border-green-500"
                >
                  + 添加现金
                </button>
              </div>
            </div>

            {/* 数据导入导出 */}
            <DataImportExport />

            {/* 投资组合概览 */}
            <div className="bg-gray-800 rounded border border-gray-700 p-3">
              <h2 className="text-xl font-bold mb-3 text-gray-100">投资组合概览</h2>
              <div className="text-lg mb-3 text-blue-400">
                总市值：¥{totalValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              {/* 大类资产统计 */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-200">大类资产分布</h3>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(assetTypeStats).map(([type, stat]) => (
                    <div key={type} className="border border-gray-700 p-2 rounded bg-gray-900">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-200">{getSecurityTypeText(type)}</span>
                        <span className="text-blue-400">{((stat.value / totalValue) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        市值：¥{stat.value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 板块统计 */}
            <div className="bg-gray-800 rounded border border-gray-700 p-3">
              <h3 className="text-lg font-semibold mb-2 text-gray-200">板块分布</h3>
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(sectorStats).map(([sector, stat]) => (
                    <div key={sector} className="border border-gray-700 p-2 rounded bg-gray-900">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-200">{sector}</span>
                        <span className="text-blue-400">{((stat.value / totalValue) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        市值：¥{stat.value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 行业统计 */}
            <div className="bg-gray-800 rounded border border-gray-700 p-3">
              <h3 className="text-lg font-semibold mb-2 text-gray-200">行业分布</h3>
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(industryStats).map(([industry, stat]) => (
                    <div key={industry} className="border border-gray-700 p-2 rounded bg-gray-900">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-200">{industry}</span>
                        <span className="text-blue-400">{((stat.value / totalValue) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        市值：¥{stat.value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧栏 - 个股列表 */}
          <div className="xl:col-span-3 space-y-4">
            <div className="bg-gray-800 rounded border border-gray-700 p-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-200">个股列表</h3>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                      className="px-3 py-1 text-sm rounded bg-gray-700 text-gray-200 border border-gray-600"
                    >
                      <option value="all">全部</option>
                      <option value="over">超出目标</option>
                      <option value="under">低于目标</option>
                      <option value="normal">正常范围</option>
                    </select>
                  )}
                  {isEditing && (
                    <button
                      onClick={handleAdjustTargetPercentages}
                      className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700 text-white"
                      title="根据当前目标值自动调整为总和100%"
                    >
                      调整占比
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isEditing ? '完成编辑' : '编辑持仓'}
                  </button>
                </div>
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-3">
                {filteredInvestments.map((investment) => (
                  <div key={investment.id} className="border border-gray-700 p-2 rounded bg-gray-900">
                    <div className="flex justify-between items-start">
                      <SecurityPrice 
                        code={investment.code} 
                        name={investment.name} 
                        id={investment.id}
                      />
                      {isEditing && (
                        <button
                          onClick={() => removeInvestment(investment.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          删除
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm mb-1 text-gray-300">持仓数量</label>
                          <input
                            type="number"
                            value={investment.amount}
                            onChange={(e) => {
                              const amount = parseFloat(e.target.value);
                              if (!isNaN(amount)) {
                                updateInvestment(investment.id, { amount });
                              }
                            }}
                            className="w-full p-1 border border-gray-600 rounded bg-gray-800 text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1 text-gray-300">目标占比 (%)</label>
                          <input
                            type="number"
                            value={investment.targetPercentage}
                            onChange={(e) => {
                              const targetPercentage = parseFloat(e.target.value);
                              if (!isNaN(targetPercentage)) {
                                updateInvestment(investment.id, { targetPercentage });
                              }
                            }}
                            className="w-full p-1 border border-gray-600 rounded bg-gray-800 text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-400">
                        <div>持仓数量：{investment.amount.toLocaleString('zh-CN')}</div>
                        <div>目标占比：{investment.targetPercentage}%</div>
                      </div>
                    )}

                    {(investment.currentPrice || investment.type === 'cash') && (
                      <div className="mt-2 text-sm text-gray-400">
                        市值：¥{((investment.type === 'cash' ? 1 : (investment.currentPrice || 0)) * investment.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {totalValue > 0 && (
                          <span className={`ml-2 ${
                            ((investment.type === 'cash' ? 1 : (investment.currentPrice || 0)) * investment.amount / totalValue) * 100 > investment.targetPercentage * 1.2 
                              ? 'text-red-400' 
                              : ((investment.type === 'cash' ? 1 : (investment.currentPrice || 0)) * investment.amount / totalValue) * 100 > investment.targetPercentage 
                                ? 'text-orange-400' 
                                : ((investment.type === 'cash' ? 1 : (investment.currentPrice || 0)) * investment.amount / totalValue) * 100 < investment.targetPercentage * 0.8
                                  ? 'text-green-500'
                                  : ((investment.type === 'cash' ? 1 : (investment.currentPrice || 0)) * investment.amount / totalValue) * 100 < investment.targetPercentage
                                    ? 'text-green-400'
                                    : ''
                          }`}>
                            (实际占比: {((investment.type === 'cash' ? 1 : (investment.currentPrice || 0)) * investment.amount / totalValue * 100).toFixed(2)}%)
                            {(((investment.type === 'cash' ? 1 : (investment.currentPrice || 0)) * investment.amount / totalValue) * 100 > investment.targetPercentage * 1.2 ||
                              ((investment.type === 'cash' ? 1 : (investment.currentPrice || 0)) * investment.amount / totalValue) * 100 < investment.targetPercentage * 0.8) && (
                              <span className="ml-1">⚠️</span>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 