# 🚀 快速启动指南

## 一键启动（推荐）

```bash
# 进入项目目录
cd /Users/potti/mywork-workspace/hyperliquid-manager

# 赋予启动脚本执行权限
chmod +x start-dev.sh

# 运行启动脚本
./start-dev.sh
```

## 手动启动

### 步骤 1: 安装依赖

```bash
cd /Users/potti/mywork-workspace/hyperliquid-manager
npm install
```

### 步骤 2: 配置环境变量

创建 `.env.local` 文件：

```bash
cat > .env.local << 'EOF'
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=please-generate-a-secure-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EOF
```

生成安全的 NEXTAUTH_SECRET：

```bash
openssl rand -base64 32
```

### 步骤 3: 配置 Google OAuth（首次使用）

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端 ID
5. 配置授权重定向 URI: `http://localhost:3000/api/auth/callback/google`
6. 将客户端 ID 和密钥填入 `.env.local`

**详细步骤请参考 `SETUP.md`**

### 步骤 4: 启动开发服务器

```bash
npm run dev
```

### 步骤 5: 访问应用

打开浏览器访问: **http://localhost:3000**

## 📁 项目结构

```
hyperliquid-manager/
├── src/
│   ├── app/                    # Next.js 应用目录
│   │   ├── page.tsx           # 欢迎页面
│   │   ├── auth/signin/       # 登录页面
│   │   ├── dashboard/         # 管理后台
│   │   │   ├── page.tsx      # 控制台首页
│   │   │   ├── users/        # 用户管理
│   │   │   └── settings/     # 系统设置
│   │   └── api/auth/         # NextAuth API
│   └── components/            # React 组件
│       ├── DashboardLayout.tsx  # 后台布局
│       └── Providers.tsx        # 全局 Provider
├── .env.local                 # 环境变量（需创建）
├── package.json              # 项目配置
└── README.md                 # 详细文档
```

## 🎯 功能特性

✅ **欢迎页面** - 精美的首页设计  
✅ **Google OAuth 登录** - 安全便捷的认证  
✅ **响应式布局** - 支持各种设备  
✅ **管理后台** - 完整的后台框架  
✅ **用户管理** - 用户列表和操作  
✅ **系统设置** - 配置管理界面  

## 🌐 访问地址

- **首页**: http://localhost:3000
- **登录**: http://localhost:3000/auth/signin
- **控制台**: http://localhost:3000/dashboard
- **用户管理**: http://localhost:3000/dashboard/users
- **系统设置**: http://localhost:3000/dashboard/settings

## ⚡ 可用命令

```bash
npm run dev      # 启动开发服务器 (http://localhost:3000)
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 代码检查
```

## 🔧 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 14.2.18 | React 框架 |
| React | 18.3.1 | UI 库 |
| TypeScript | 5.6.3 | 类型系统 |
| Ant Design | 5.22.2 | UI 组件库 |
| NextAuth.js | 4.24.10 | 认证库 |

## 🐛 常见问题

### 问题 1: 端口已被占用

```bash
# 查找占用 3000 端口的进程
lsof -ti:3000

# 终止进程
kill -9 $(lsof -ti:3000)

# 或使用其他端口
PORT=3001 npm run dev
```

### 问题 2: Google OAuth 登录失败

检查：
1. `.env.local` 配置是否正确
2. Google Cloud Console 重定向 URI 是否匹配
3. 是否添加了测试用户

### 问题 3: 样式不显示

```bash
# 清除缓存重启
rm -rf .next
npm run dev
```

## 📚 更多文档

- **SETUP.md** - 详细的安装和配置指南
- **README.md** - 完整的项目文档
- [Next.js 文档](https://nextjs.org/docs)
- [Ant Design 文档](https://ant.design)

## 🎉 开始使用

现在你可以开始开发了！享受编码的乐趣！

```bash
# 启动项目
npm run dev

# 打开浏览器访问
open http://localhost:3000
```

---

如有问题，请查看 `SETUP.md` 获取详细帮助。

