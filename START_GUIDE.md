# Hyperliquid Manager 启动指南

## 🚀 Google OAuth 登录配置

本项目使用 Google OAuth 2.0 进行用户认证。

### ⚠️ 重要提示

**在中国大陆使用 Google OAuth 需要代理工具**（如 Clash、V2Ray 等）。

## 📋 配置步骤

### 1. 获取 Google OAuth 凭据

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端 ID：
   - 应用类型：Web 应用
   - 授权的重定向 URI：`http://localhost:3000/api/auth/callback/google`
5. 复制客户端 ID 和客户端密钥

### 2. 配置环境变量

编辑 `.env.local` 文件：

```env
# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=生成一个随机密钥

# Google OAuth 2.0
GOOGLE_CLIENT_ID=你的客户端ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-你的客户端密钥
```

生成 `NEXTAUTH_SECRET`：
```bash
openssl rand -base64 32
```

### 3. 添加测试用户

在 Google Cloud Console 的 OAuth 同意屏幕中：
1. 用户类型选择 "外部"
2. 在 "测试用户" 部分添加您的 Google 账号

## 🌐 启动方式

### 方式 1：使用代理启动（推荐 - 中国大陆用户）

**前提条件：**
- 已安装并启动代理工具（Clash、V2Ray、Shadowsocks 等）
- 知道代理端口号

**启动命令：**

```bash
cd /Users/potti/mywork-workspace/hyperliquid-manager

# 使用代理启动脚本（默认端口 7897）
./start-with-proxy.sh

# 或指定自定义端口
./start-with-proxy.sh 7890   # Clash 默认端口
./start-with-proxy.sh 1080   # V2Ray/SS 默认端口
```

**常见代理工具端口：**
- Clash: `7890` 或 `7897`
- V2Ray: `1080`
- Shadowsocks: `1080`
- Surge: `6152`

### 方式 2：手动设置代理启动

```bash
cd /Users/potti/mywork-workspace/hyperliquid-manager

# 设置代理环境变量（根据你的代理端口调整）
export HTTP_PROXY=http://127.0.0.1:7897
export HTTPS_PROXY=http://127.0.0.1:7897

# 启动开发服务器
npm run dev
```

### 方式 3：直接启动（海外用户）

如果你在海外或网络可以直接访问 Google：

```bash
cd /Users/potti/mywork-workspace/hyperliquid-manager
npm run dev
```

## 🧪 测试登录

1. 启动成功后，访问 http://localhost:3000
2. 点击"立即登录"
3. 点击"使用 Google 账号登录"
4. 选择您添加的测试用户
5. 授权应用
6. 登录成功！

## ❓ 常见问题

### Q1: 点击登录后超时或报错

**错误信息：** `outgoing request timed out after 3500ms`

**原因：** 无法连接到 Google OAuth 服务器

**解决方案：**
1. 确保代理工具正在运行
2. 测试代理是否可访问 Google：
   ```bash
   curl -x http://127.0.0.1:7897 https://www.google.com
   ```
3. 使用代理启动脚本：
   ```bash
   ./start-with-proxy.sh
   ```
4. 如果仍然失败，尝试重启代理工具

### Q2: 登录成功但跳转失败

**检查项：**
1. `.env.local` 中的 `NEXTAUTH_URL` 是否正确
2. Google OAuth 重定向 URI 是否为：`http://localhost:3000/api/auth/callback/google`
3. 确保 `NEXTAUTH_SECRET` 已设置

### Q3: Google 授权页面显示 "访问被阻止"

**原因：** 未添加测试用户

**解决：**
1. 访问 Google Cloud Console
2. 进入 OAuth 同意屏幕
3. 在 "测试用户" 部分添加你要用于登录的 Google 账号

### Q4: 如何查看代理是否生效？

```bash
# 测试代理连接
curl -x http://127.0.0.1:7897 -I https://accounts.google.com

# 应该返回 HTTP 200 或 302
```

### Q5: 端口被占用

```bash
# 查看占用 3000 端口的进程
lsof -ti:3000

# 终止进程
kill -9 $(lsof -ti:3000)

# 或使用启动脚本（会自动释放端口）
./start-with-proxy.sh
```

## 🔧 代理配置说明

### 修改代理端口

编辑 `start-with-proxy.sh`：

```bash
# 找到这一行并修改端口
PROXY_PORT="7897"  # 改为你的代理端口
```

### 验证代理配置

启动脚本会自动测试代理连接，如果看到：

```
✅ 代理连接成功
```

说明代理配置正确。

### 全局代理 vs 终端代理

**终端代理（推荐）：** 只影响当前终端会话
```bash
export HTTP_PROXY=http://127.0.0.1:7897
export HTTPS_PROXY=http://127.0.0.1:7897
npm run dev
```

**全局代理：** 影响整个系统（在代理工具中配置）

## 📊 环境变量完整示例

创建 `.env.local` 文件：

```env
# NextAuth 基础配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=GZx8VqKPnJ9vL7wD3mRtYbCqHpNfXjKl2sWaEuIoTgMh

# Google OAuth 2.0（必填）
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx

# 后端 API 地址（可选，如果需要连接后端）
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 🎯 快速启动清单

- [ ] 安装依赖：`npm install`
- [ ] 配置 Google OAuth 凭据
- [ ] 创建 `.env.local` 文件
- [ ] 添加 Google 测试用户
- [ ] 启动代理工具
- [ ] 运行 `./start-with-proxy.sh`
- [ ] 访问 http://localhost:3000
- [ ] 测试登录

## 📚 相关文档

- **OAUTH_SETUP.md** - OAuth 详细配置和原理
- **README.md** - 项目完整文档
- **src/lib/api-client.ts** - 后端 API 调用示例

## 🆘 需要帮助？

如果遇到问题：

1. 检查 `.env.local` 配置是否正确
2. 确认代理工具正在运行
3. 查看浏览器控制台和终端错误信息
4. 参考上述常见问题解决方案

---

**准备好了吗？现在就开始吧！** 🚀

```bash
./start-with-proxy.sh
```

