import React from 'react';
import { useConfigStore } from '../../store/configStore';
import { DataSource } from '../../services/factory';

const dataSourceNames: Record<DataSource, string> = {
  ths: '同花顺',
  eastmoney: '东方财富',
  sina: '新浪财经',
  failover: '自动切换'
};

export const DataSourceConfig: React.FC = () => {
  const { defaultSource, dataSources, setDefaultSource, updateDataSourceConfig } = useConfigStore();

  const handleDefaultSourceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDefaultSource(event.target.value as DataSource);
  };

  const handleConfigChange = (source: DataSource, field: string, value: string | number | boolean) => {
    updateDataSourceConfig(source, { [field]: value });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">数据源配置</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          默认数据源
        </label>
        <select
          value={defaultSource}
          onChange={handleDefaultSourceChange}
          className="w-full p-2 border rounded"
        >
          {Object.entries(dataSourceNames).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-6">
        {Object.entries(dataSources).map(([source, config]) => (
          <div key={source} className="border p-4 rounded">
            <h3 className="font-bold mb-3">{dataSourceNames[source as DataSource]}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">
                  启用
                </label>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => handleConfigChange(source as DataSource, 'enabled', e.target.checked)}
                  className="form-checkbox"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">
                  最大失败次数
                </label>
                <input
                  type="number"
                  value={config.maxFailures}
                  onChange={(e) => handleConfigChange(source as DataSource, 'maxFailures', parseInt(e.target.value))}
                  min={1}
                  max={10}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">
                  失败重置时间（分钟）
                </label>
                <input
                  type="number"
                  value={config.failureResetInterval / (60 * 1000)}
                  onChange={(e) => handleConfigChange(
                    source as DataSource,
                    'failureResetInterval',
                    parseInt(e.target.value) * 60 * 1000
                  )}
                  min={1}
                  max={60}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 