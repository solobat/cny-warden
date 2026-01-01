import React, { useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useInvestmentStore } from '../store';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C43'];

export const App: React.FC = () => {
  const { investments, loadInvestments } = useInvestmentStore();

  useEffect(() => {
    loadInvestments();
  }, [loadInvestments]);

  const totalAmount = investments.reduce((sum, inv) => {
    // 现金类型特殊处理，价格始终为1
    const price = inv.type === 'cash' ? 1 : (inv.currentPrice || 0);
    return sum + price * inv.amount;
  }, 0);

  const chartData = investments.map(inv => ({
    name: inv.name,
    value: (inv.type === 'cash' ? 1 : (inv.currentPrice || 0)) * inv.amount
  }));

  return (
    <div className="w-[800px] min-h-screen bg-base-100 p-4">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">投资组合概览</h1>
          <a
            href="options.html"
            target="_blank"
            className="btn btn-primary btn-sm"
          >
            管理投资组合
          </a>
        </div>

        {investments.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-base-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">资产分布</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-base-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">持仓明细</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>名称</th>
                      <th>代码</th>
                      <th>持仓数量</th>
                      <th>当前价格</th>
                      <th>市值</th>
                      <th>实际占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((investment) => (
                      <tr key={investment.id}>
                        <td>{investment.name}</td>
                        <td>{investment.code}</td>
                        <td>{investment.amount}</td>
                        <td>¥{(investment.type === 'cash' ? 1 : (investment.currentPrice || 0)).toFixed(2)}</td>
                        <td>¥{((investment.type === 'cash' ? 1 : (investment.currentPrice || 0)) * investment.amount).toFixed(2)}</td>
                        <td>{totalAmount > 0 ? `${(((investment.type === 'cash' ? 1 : (investment.currentPrice || 0)) * investment.amount / totalAmount) * 100).toFixed(2)}%` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg mb-4">暂无投资数据</p>
            <a
              href="options.html"
              target="_blank"
              className="btn btn-primary"
            >
              添加投资
            </a>
          </div>
        )}
      </div>
    </div>
  );
}; 