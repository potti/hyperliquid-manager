# Hyperliquid Manager 安装指南

## 快速开始

### 1. 安装依赖

在项目根目录运行：

```bash
npm install
```

如果遇到问题，可以尝试：

```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 2. 配置 Google OAuth 2.0

#### 步骤 A: 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击顶部的项目选择器，创建新项目
3. 项目名称：`Hyperliquid Manager` (或任意名称)

#### 步骤 B: 启用 Google+ API

1. 在左侧菜单选择 "API和服务" > "库"
2. 搜索 "Google+ API"
3. 点击启用

#### 步骤 C: 创建 OAuth 2.0 凭据

1. 在左侧菜单选择 "API和服务" > "凭据"
2. 点击 "创建凭据" > "OAuth 客户端 ID"
3. 如果提示配置同意屏幕，先完成同意屏幕配置：
   - 用户类型：选择"外部"
   - 应用名称：`Hyperliquid Manager`
   - 用户支持电子邮件：填写您的邮箱
   - 授权域：留空（开发环境）
   - 开发者联系信息：填写您的邮箱
   - 点击"保存并继续"
   - 范围：保持默认，点击"保存并继续"
   - 测试用户：添加您要用于测试的 Google 账号
4. 返回创建 OAuth 客户端 ID：
   - 应用类型：选择"Web 应用"
   - 名称：`Hyperliquid Manager`
   - 授权的重定向 URI：添加以下 URI
     - `http://localhost:3000/api/auth/callback/google`
     - (生产环境) `https://your-domain.com/api/auth/callback/google`
5. 点击"创建"
6. 复制客户端 ID 和客户端密钥

#### 步骤 D: 配置环境变量

1. 复制 `.env.local` 文件（如果不存在，创建它）：

```bash
cp .env.local .env.local.backup  # 备份（如果有的话）
```

2. 编辑 `.env.local` 文件：

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production

# Google OAuth 2.0
GOOGLE_CLIENT_ID=你的客户端ID
GOOGLE_CLIENT_SECRET=你的客户端密钥
```

3. 生成安全的 `NEXTAUTH_SECRET`：

```bash
# 使用 openssl 生成随机字符串
openssl rand -base64 32
```

将生成的字符串替换 `your-secret-key-change-this-in-production`

### 3. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

### 4. 访问应用

打开浏览器访问：
- 首页：http://localhost:3000
- 登录页：http://localhost:3000/auth/signin
- 控制台：http://localhost:3000/dashboard (需要登录)

### 5. 测试登录

1. 点击"立即登录"或访问登录页
2. 点击"使用 Google 账号登录"
3. 选择您在 Google Cloud Console 中添加的测试用户
4. 授权应用访问您的 Google 账号
5. 成功后将跳转到管理后台

## 常见问题

### Q1: npm install 失败

**解决方案：**
```bash
# 使用 Node.js 20.x
nvm use 20

# 清除缓存
npm cache clean --force

# 重新安装
npm install
```

### Q2: Google OAuth 登录失败

**可能原因：**
1. 环境变量配置错误
2. 重定向 URI 不匹配
3. 测试用户未添加

**解决方案：**
1. 检查 `.env.local` 文件配置是否正确
2. 确保 Google Cloud Console 中的重定向 URI 为 `http://localhost:3000/api/auth/callback/google`
3. 在 Google Cloud Console 的 OAuth 同意屏幕中添加测试用户

### Q3: 页面样式异常

**解决方案：**
```bash
# 清除 Next.js 缓存
rm -rf .next

# 重新启动
npm run dev
```

### Q4: TypeScript 报错

**解决方案：**
```bash
# 重新生成类型文件
npm run dev  # 启动一次开发服务器会自动生成
```

## 生产部署

### 使用 Vercel (推荐)

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 中导入项目
3. 配置环境变量（与 `.env.local` 相同）
4. 更新 Google OAuth 重定向 URI 为生产域名
5. 部署

### 使用 Docker

```bash
# 构建镜像
docker build -t hyperliquid-manager .

# 运行容器
docker run -p 3000:3000 --env-file .env.local hyperliquid-manager
```

### 使用 Docker Compose

```bash
# 启动
docker-compose up -d

# 停止
docker-compose down
```

## 项目脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run lint` - 运行 ESLint 检查

## 技术支持

如有问题，请参考：
- [Next.js 文档](https://nextjs.org/docs)
- [NextAuth.js 文档](https://next-auth.js.org)
- [Ant Design 文档](https://ant.design)

