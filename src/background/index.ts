import './onInstalled.ts'
import './onStorageChanged.ts'
import { PriceUpdater } from '../services/priceUpdater';
import { useInvestmentStore } from '../store';

// 初始化价格更新服务
const priceUpdater = PriceUpdater.getInstance();

// 监听扩展安装或更新
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed or updated');
  // 加载投资数据
  useInvestmentStore.getState().loadInvestments();
  // 启动价格更新服务
  priceUpdater.start();
});

// 监听扩展启动
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
  // 加载投资数据
  useInvestmentStore.getState().loadInvestments();
  // 启动价格更新服务
  priceUpdater.start();
});

// 监听扩展关闭
chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension suspended');
  // 停止价格更新服务
  priceUpdater.stop();
}); 