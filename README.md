# Hyperliquid Manager

现代化的管理后台系统，基于 Next.js 14 + TypeScript + Ant Design 构建。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **UI 组件库**: Ant Design 5
- **认证**: NextAuth.js (Google OAuth 2.0)
- **状态管理**: React Hooks
- **样式**: CSS + Ant Design

## 功能特性

- ✅ Google OAuth 2.0 登录
- ✅ 响应式管理后台布局
- ✅ 用户管理
- ✅ 系统设置
- ✅ 现代化的 UI/UX
- ✅ 完整的类型支持

## 开始使用

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local` 文件并配置以下变量：

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### 获取 Google OAuth 凭据

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端 ID
5. 配置授权重定向 URI: `http://localhost:3000/api/auth/callback/google`
6. 复制客户端 ID 和密钥到 `.env.local`

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
hyperliquid-manager/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API 路由
│   │   │   └── auth/             # NextAuth 认证
│   │   ├── auth/                 # 认证页面
│   │   │   └── signin/           # 登录页
│   │   ├── dashboard/            # 管理后台页面
│   │   │   ├── users/            # 用户管理
│   │   │   ├── settings/         # 系统设置
│   │   │   └── page.tsx          # 控制台首页
│   │   ├── layout.tsx            # 根布局
│   │   ├── page.tsx              # 首页
│   │   └── globals.css           # 全局样式
│   ├── components/               # React 组件
│   │   ├── DashboardLayout.tsx   # 管理后台布局
│   │   └── Providers.tsx         # 全局 Provider
│   └── types/                    # TypeScript 类型定义
│       └── next-auth.d.ts        # NextAuth 类型
├── public/                       # 静态资源
├── .env.local                    # 环境变量
├── next.config.js                # Next.js 配置
├── tsconfig.json                 # TypeScript 配置
├── package.json                  # 依赖配置
└── README.md                     # 项目文档
```

## 页面说明

### 首页 (/)
- 欢迎页面，展示系统特性
- 引导用户登录

### 登录页 (/auth/signin)
- Google OAuth 2.0 登录
- 登录成功后跳转到控制台

### 控制台 (/dashboard)
- 系统概览
- 数据统计展示
- 用户信息

### 用户管理 (/dashboard/users)
- 用户列表
- 用户增删改查

### 系统设置 (/dashboard/settings)
- 系统配置
- 功能开关

## 开发指南

### 添加新页面

1. 在 `src/app/dashboard/` 下创建新目录
2. 创建 `page.tsx` 文件
3. 使用 `DashboardLayout` 包裹内容
4. 在 `DashboardLayout.tsx` 中添加菜单项

### 添加 API 路由

在 `src/app/api/` 下创建新的路由处理器。

### 自定义主题

修改 `src/app/layout.tsx` 中的 `ConfigProvider` theme 配置。

## 部署

### Vercel (推荐)

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### Docker

```bash
docker build -t hyperliquid-manager .
docker run -p 3000:3000 hyperliquid-manager
```

## 许可证

MIT

