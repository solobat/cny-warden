import { create } from 'zustand';
import { DataSource } from '../services/factory';

interface DataSourceConfig {
  source: DataSource;
  maxFailures: number;
  failureResetInterval: number;  // 毫秒
  enabled: boolean;
}

interface ConfigState {
  defaultSource: DataSource;
  dataSources: Record<DataSource, DataSourceConfig>;
  setDefaultSource: (source: DataSource) => void;
  updateDataSourceConfig: (source: DataSource, config: Partial<DataSourceConfig>) => void;
  loadConfig: () => Promise<void>;
}

const defaultConfig: Record<DataSource, DataSourceConfig> = {
  eastmoney: {
    source: 'eastmoney',
    maxFailures: 3,
    failureResetInterval: 5 * 60 * 1000,
    enabled: true
  },
  ths: {
    source: 'ths',
    maxFailures: 3,
    failureResetInterval: 5 * 60 * 1000,
    enabled: false  // 禁用同花顺
  },
  sina: {
    source: 'sina',
    maxFailures: 3,
    failureResetInterval: 5 * 60 * 1000,
    enabled: false  // 禁用新浪财经
  },
  failover: {
    source: 'failover',
    maxFailures: 3,
    failureResetInterval: 5 * 60 * 1000,
    enabled: true
  }
};

export const useConfigStore = create<ConfigState>((set) => ({
  defaultSource: 'eastmoney',  // 默认使用东方财富
  dataSources: defaultConfig,

  setDefaultSource: (source) => {
    set({ defaultSource: source });
    chrome.storage.local.set({ defaultSource: source });
  },

  updateDataSourceConfig: (source, config) => {
    set((state) => {
      const newConfig = {
        ...state.dataSources,
        [source]: {
          ...state.dataSources[source],
          ...config
        }
      };
      chrome.storage.local.set({ dataSources: newConfig });
      return { dataSources: newConfig };
    });
  },

  loadConfig: async () => {
    const result = await chrome.storage.local.get(['defaultSource', 'dataSources']);
    set({
      defaultSource: result.defaultSource || 'eastmoney',  // 默认使用东方财富
      dataSources: result.dataSources || defaultConfig
    });
  }
})); 