# 装修预算与采购看板

<div align="center">
  <br/>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='80' height='80' rx='20' fill='%230A84FF'/%3E%3Cpath d='M40 20L40 60M24 36L40 20L56 36' stroke='white' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
    <img alt="logo" src="data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='80' height='80' rx='20' fill='%230A84FF'/%3E%3Cpath d='M40 20L40 60M24 36L40 20L56 36' stroke='white' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E" width="80" height="80">
  </picture>
  <br/>
  <h3>Renovation Budget & Procurement Dashboard</h3>
  <p><em>装修预算管理 · 采购跟踪 · 云端同步 · 数据看板</em></p>
  <br/>
</div>

---

## 项目概览

一个采用苹果设计语言打造的**装修预算与采购管理系统**。原生 JavaScript 单页应用，具备毛玻璃动效、液态渐变动画、数据可视化看板，支持 Gitee/GitHub 双平台云端同步与历史版本回溯。

| 属性 | 说明 |
|------|------|
| 类型 | 纯前端 SPA（单页应用） |
| 数据存储 | `localStorage` 本地持久化 + 云端 JSON 同步 |
| 设计语言 | Apple Human Interface Guidelines · Dark Mode · Glassmorphism |
| 浏览器支持 | 现代浏览器（Chrome/Firefox/Safari/Edge） |

---

## 核心功能

### 预算项目管理
- 装修项目**增删改查**，支持拖拽排序
- 字段：名称 / 品牌 / 分类 / 数量 / 预算金额 / 实际金额 / 购买渠道 / 状态 / 备注
- 本地数据持久化（`localStorage`），刷新不丢失

### 数据统计看板
- 顶部四维统计卡片：总预算、实际支出、预算差额、完成率
- 分类汇总：按「家电」「必要支出」「软装」「硬装」等分类统计
- 可视化图表：**Chart.js** 驱动的预算对比柱状图 / 分类饼图
- 实时响应的 `calculateStatistics()` 计算引擎

### 智能筛选与搜索
- 按状态筛选：全部 / 完成 / 付款 / 待购
- 实时搜索过滤 + 多字段排序
- 筛选结果自动联动统计与图表

### 云端同步（Gitee / GitHub）
- 双平台无缝切换，通过 `syncConfig.provider` 控制
- 推送备份：本地数据 **Base64 编码** → 云端仓库
- 历史版本：推送前自动备份旧版本至 `history/` 目录
- 差分同步：拉取时展示 **新增 / 修改 / 删除** 细粒度对比

### 数据导出
- **Excel 导出**（`xlsx-js-style`）：含总计汇总 + 分类汇总 + 明细清单三层结构，支持条件着色样式
- **JSON 导出/导入**：完整数据备份与恢复

---

## 技术架构

```
┌──────────────────────────────────────────────────┐
│                    index.html                      │
│  ┌──────────┐  ┌──────────────────────────────┐  │
│  │  Sidebar  │  │         Main Content          │  │
│  │  Navigation│  │  ┌─────────────────────┐     │  │
│  │  预算看板   │  │  │   Statistics Cards   │     │  │
│  │  分类列表   │  │  └─────────────────────┘     │  │
│  │  设置      │  │  ┌─────────────────────┐     │  │
│  └──────────┘  │  │   Toolbar (搜索/筛选) │     │  │
│                │  └─────────────────────┘     │  │
│                │  ┌─────────────────────┐     │  │
│                │  │   Data Table / Grid  │     │  │
│                │  └─────────────────────┘     │  │
│                │  ┌─────────────────────┐     │  │
│                │  │   Charts (Chart.js)  │     │  │
│                │  └─────────────────────┘     │  │
│  ┌──────────┐  │  ┌─────────────────────┐     │  │
│  │  Modals   │  │  │   Cloud Sync Panel  │     │  │
│  │  编辑/设置 │  │  └─────────────────────┘     │  │
│  └──────────┘  └──────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### 依赖项

| 库 | 版本 | 用途 |
|----|------|------|
| [Phosphor Icons](https://phosphoricons.com/) | latest | 图标系统 |
| [SortableJS](https://sortablejs.github.io/Sortable/) | latest | 拖拽排序 |
| [xlsx-js-style](https://github.com/gitbrent/xlsx-js-style) | 1.2.0 | 样式化 Excel 导出 |
| [Chart.js](https://www.chartjs.org/) | latest | 数据可视化 |

---

## 文件结构

```
zx/
├── index.html              ← 主应用（全部 UI + 逻辑 + 样式）
├── CLAUDE.md               ← 项目说明书（就是本文件 🎯）
├── 装修预算.json            ← 云端同步的 JSON 数据文件
├── replace.js              ← GitHub → Gitee 文本替换脚本
├── update_gitee.js          ← Gitee 推送/同步逻辑升级脚本
├── update_dual.js           ← 双平台（Gitee + GitHub）支持脚本
├── update_excel.js          ← Excel 导出升级脚本（三层样式）
├── history/                 ← 云端历史版本备份目录
│   └── *.json               ← 按时间戳命名的历史快照
└── .vscode/
    └── settings.json        ← VS Code 配置（Live Server 端口 5501）
```

---

## 核心设计语言

### 设计系统

```
🎨 色彩系统
   ├── 背景: #000000 → 纯黑底 + 径向渐变光晕
   ├── 卡片: rgba(28, 28, 30, 0.45) → 多层毛玻璃叠加
   ├── 文字: #F5F5F7（主）/ #86868B（次）/ #515154（辅）
   ├── 强调色: #0A84FF（蓝）/ #30D158（绿）/ #FF9F0A（橙）/ #FF453A（红）
   └── 边框: rgba(255, 255, 255, 0.06) → 极致透明

✨ 动效系统
   ├── 弹性过渡: cubic-bezier(0.25, 0.8, 0.15, 1.15)
   ├── 缓出过渡: cubic-bezier(0.2, 0.8, 0.2, 1)
   ├── 呼吸动画: breathe / breatheSubtle / breatheGlow
   ├── 液态流光: liquidShine（header 扫光效果）
   ├── 浮动气泡: liquidFloat（body 装饰光晕）
   └── 淡入上移: fadeUpIn（内容入场）

🧊 毛玻璃系统
   ├── blur(80px) saturate(250%) → 液态玻璃模糊
   ├── 多层光晕 + 径向渐变叠加
   ├── inset 高光边框模拟真实玻璃质感
   └── 悬浮加深阴影 + 光晕扩散效果
```

### CSS 变量体系

所有设计令牌集中定义在 `:root` 中，分五大模块：

1. **颜色令牌** — `--bg-color`, `--accent-*`, `--text-*`
2. **毛玻璃令牌** — `--glass-blur`, `--glass-bg`, `--glass-border`
3. **阴影令牌** — `--shadow-sm/md/lg/float/card-hover`
4. **圆角令牌** — `--radius-xl/lg/md/sm`
5. **动效令牌** — `--ease-spring`, `--ease-out`, `--ease-in-out`

---

## 本地开发

项目为纯静态 HTML，无需构建工具，直接在浏览器中运行：

```bash
# VS Code Live Server（推荐）
# 快捷键: Ctrl+Shift+P → "Open with Live Server"
# 端口: 5501（已配置）

# 或 Python 简易 HTTP 服务
python3 -m http.server 8000

# 或 Node.js serve
npx serve .
```

> **注意**: 云端同步功能需要浏览器支持 `fetch` API，且跨域访问 Gitee/GitHub API。Gitee API 原生支持 CORS。

---

## 数据格式

### 核心数据模型

```typescript
interface Appliance {
  id: number;              // 时间戳 ID
  color: string;           // 标签颜色
  locked: boolean;         // 锁定状态
  name: string;            // 项目名称
  brand: string;           // 品牌
  quantity: number;        // 数量
  budgetPrice: number;     // 预算金额
  actualPrice: number;     // 实际金额
  purchaseChannel: string; // 购买渠道
  status: '完成' | '付款' | '待购';
  notes: string;           // 备注
  category: string;        // 分类
  priority: '高' | '中' | '低';
  sortIndex: number;       // 排序索引
}

interface ExportData {
  exportTime: string;
  appliances: Appliance[];
  statistics: {
    totalBudget: number;
    totalActual: number;
    budgetDifference: number;
    totalQuantity: number;
    completedCount: number;
    completionRate: number;
    categoryStats: Record<string, CategoryStat>;
  };
}
```

### 云端同步配置

```javascript
let syncConfig = {
  provider: 'gitee',      // 'gitee' | 'github'
  token: '',              // 私人令牌
  owner: 'lionel-wang',   // 仓库所有者
  repo: 'zx-json',        // 仓库名
  path: '装修预算.json',   // 文件路径
  branch: 'gitee'         // 分支
};
```

---

## 辅助脚本

| 脚本 | 功能 | 运行方式 |
|------|------|----------|
| `replace.js` | GitHub → Gitee 文本替换 | `node replace.js` |
| `update_gitee.js` | 升级 Gitee 推送/同步逻辑 | `node update_gitee.js` |
| `update_dual.js` | 添加双平台支持 | `node update_dual.js` |
| `update_excel.js` | 升级 Excel 导出样式 | `node update_excel.js` |

---

## 开发规范

### 代码风格
- 原生 JavaScript（ES6+），无框架依赖
- 全局函数 + 闭包变量管理模式
- CSS 变量驱动主题，`-webkit-` 前缀兼容 Safari

### 设计原则
- **移动优先响应式**：`clamp()` + 弹性布局
- **渐进增强**：基础功能不依赖 JavaScript
- **性能优先**：DOM 操作最小化，`requestAnimationFrame` 驱动动画

### 安全规范
- Token 仅存储在 `localStorage`，不发送至第三方
- 所有用户输入通过 `textContent` / `innerHTML` 安全处理
- XSS 防护：避免直接拼接未经过滤的用户输入至 DOM
- 敏感数据脱敏展示，日志中禁止打印 Token

---

<div align="center">
  <br/>
  <sub>Built with &hearts; by <a href="https://github.com/lionel-wang">lionel-wang</a></sub>
  <br/>
  <sub>Design Inspired by Apple</sub>
  <br/>
  <br/>
</div>
