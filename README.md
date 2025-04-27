# CNY Warden

一个用于管理个人投资组合的Chrome扩展，帮助用户跟踪和管理各种投资资产的比例。

## 功能特点

- 支持多种投资类型：股票、基金、ETF、黄金等
- 可视化投资组合分布
- 设置目标投资比例
- 投资比例偏离提醒
- 数据本地存储，保护隐私

## 技术栈

- React + TypeScript
- Vite
- TailwindCSS + DaisyUI
- Formik + Yup
- Recharts
- Dexie (IndexedDB)

## 开发设置

1. 克隆仓库
```bash
git clone https://github.com/yourusername/cny-warden.git
cd cny-warden
```

2. 安装依赖
```bash
npm install
```

3. 开发模式
```bash
npm run dev
```

4. 构建生产版本
```bash
npm run build
```

## 使用说明

1. 在Chrome浏览器中安装扩展
2. 点击扩展图标打开选项页面
3. 添加您的投资项，包括：
   - 投资名称
   - 投资类型
   - 投资金额
   - 目标比例
4. 查看投资组合分布图表
5. 当投资比例偏离目标时，会收到提醒

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT
