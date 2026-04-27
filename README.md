# UPS包裹追踪监控系统

## 项目概述

这是一个基于Next.js的UPS包裹追踪监控系统，支持批量监控多个UPS追踪码，自动定时刷新，并提供状态变化通知功能。

## 主要功能

- ✅ **追踪码管理**：添加、删除、查看UPS追踪码
- ✅ **批量监控**：支持同时监控多个包裹
- ✅ **自动刷新**：可配置定时自动刷新频率（5分钟/15分钟/30分钟/1小时）
- ✅ **状态变化通知**：检测到状态变化时发送浏览器通知
- ✅ **本地存储**：追踪码和设置保存在浏览器本地存储中
- ✅ **物流详情**：查看包裹物流历史记录
- ✅ **17Track集成**：支持17Track API查询（需配置Token）
- ✅ **UPS公开接口**：支持UPS官方公开追踪接口

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **HTTP客户端**: coze-coding-dev-sdk (FetchClient)

## 项目结构

```
├── src/
│   ├── app/
│   │   ├── page.tsx              # 追踪码管理主页面
│   │   ├── layout.tsx            # 根布局
│   │   ├── globals.css           # 全局样式
│   │   └── api/
│   │       └── track/
│   │           └── route.ts       # UPS追踪API路由
│   └── components/
│       └── ui/                   # shadcn/ui组件库
├── public/                       # 静态资源
├── package.json
└── tsconfig.json
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
# 或
coze dev
```

### 构建生产版本

```bash
pnpm build
```

### 启动生产服务器

```bash
pnpm start
```

## API接口

### POST /api/track

查询物流追踪信息（支持UPS、FedEx、DHL等主流快递）

**请求体**:
```json
{
  "trackingNumber": "1Z999AA10123456784",
  "carrier": "ups"  // 可选，快递公司代码
}
```

**响应**:
```json
{
  "status": "In Transit",
  "description": "包裹正在运输中",
  "location": "物流中心",
  "carrier": "UPS",
  "estimatedDelivery": "2026-04-28",
  "events": [
    {
      "date": "2026-04-27",
      "time": "10:16:24 AM",
      "status": "In Transit",
      "location": "物流中心",
      "description": "包裹当前状态: 包裹正在运输中"
    }
  ]
}
```

## 数据查询方案

系统按以下优先级尝试获取真实物流数据：

1. **17Track API** - 需要配置 `SEVENTEEN_TOKEN` 环境变量
2. **UPS公开追踪接口** - 自动尝试
3. **UPS/17Track网页抓取** - 解析公开页面

### 配置17Track API Token

17Track提供免费API接口，支持全球主流快递追踪：

1. 访问 [17Track开发者平台](https://www.17track.net/en-us/apis) 注册账号
2. 获取API Token
3. 配置环境变量：

```bash
# 在部署环境或本地 .env 文件中设置
SEVENTEEN_TOKEN=你的17Track_API_Token
```

17Track API优势：
- 支持 500+ 快递公司
- 免费额度充足
- 覆盖全球主流物流

## 使用说明

### 添加追踪码

1. 在首页输入框中输入UPS追踪码
2. 点击"添加"按钮
3. 系统会自动查询并显示追踪信息

### 自动刷新设置

1. 点击右上角的设置图标
2. 开启"自动刷新"开关
3. 选择刷新间隔（5分钟/15分钟/30分钟/1小时）
4. 启用浏览器通知以接收状态更新提醒

### 查看详情

1. 点击包裹卡片中的"查看详情"按钮
2. 可以查看完整的物流历史记录

## 数据存储

- **追踪码列表**: `localStorage.ups-tracking-list`
- **设置**: `localStorage.ups-tracking-settings`
- **通知**: `localStorage.ups-tracking-notifications`

## 注意事项

⚠️ **重要**: 当前API使用模拟数据，因为UPS官方追踪页面需要JavaScript渲染或API密钥才能获取真实物流信息。如需生产使用，请：

1. 申请UPS API密钥
2. 使用UPS Tracking API获取真实数据
3. 或者集成第三方物流追踪服务

## 开发规范

- 使用TypeScript strict模式
- 组件使用'client'指令声明为客户端组件
- 样式使用Tailwind CSS
- UI组件使用shadcn/ui

## 环境变量

项目运行时会自动使用以下环境变量：

- `DEPLOY_RUN_PORT`: 服务端口（默认5000）
- `COZE_PROJECT_DOMAIN_DEFAULT`: 访问域名
- `COZE_PROJECT_ENV`: 运行环境（DEV/PROD）
