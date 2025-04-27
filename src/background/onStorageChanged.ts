import { Investment } from "../store/index";

// 监听投资数据变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.investments) {
    const newInvestments: Investment[] = changes.investments.newValue;
    const oldInvestments: Investment[] = changes.investments.oldValue || [];

    // 检查是否需要再平衡
    const needsRebalance = checkRebalanceNeeded(newInvestments);
    if (needsRebalance) {
      notifyRebalance(needsRebalance);
    }
  }
});

function checkRebalanceNeeded(investments: Investment[]) {
  if (!investments.length) return null;

  const totalAmount = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const needsRebalance = investments.filter(inv => {
    const actualPercentage = (inv.amount / totalAmount) * 100;
    const deviation = Math.abs(actualPercentage - inv.targetPercentage);
    return deviation > 5;
  });

  return needsRebalance.length > 0 ? needsRebalance : null;
}

function notifyRebalance(investments: Investment[]) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'img/icon-128.png',
    title: '投资组合需要再平衡',
    message: `${investments.length}个投资项的实际比例与目标比例偏差超过5%，建议进行再平衡。`,
    priority: 2,
  });
} 