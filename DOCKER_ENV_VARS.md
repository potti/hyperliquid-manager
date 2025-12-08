# Docker 环境变量配置说明

## 问题分析

经过检查，发现以下问题：

### 1. 环境变量名称不匹配

**代码中实际使用的变量：**
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - 用于前端 Google Sign-In（在 `src/app/auth/google-login/page.tsx` 中使用）
- `NEXT_PUBLIC_API_URL` - 用于 API 调用（在 `src/lib/api-client.ts` 中使用）

**docker-compose.yml 中配置的变量：**
- `GOOGLE_CLIENT_ID` - ❌ 名称不匹配，不会被使用
- `GOOGLE_CLIENT_SECRET` - ❌ 代码中未使用

### 2. Next.js 环境变量特性

在 Next.js 中：
- **`NEXT_PUBLIC_*` 变量**：在构建时（`npm run build`）被嵌入到客户端代码中，必须在构建时提供
- **普通环境变量**：只在服务端可用，运行时提供即可

### 3. Dockerfile 构建过程

Dockerfile 使用多阶段构建：
1. **deps 阶段**：安装依赖
2. **builder 阶段**：构建应用（需要 `NEXT_PUBLIC_*` 变量）
3. **runner 阶段**：运行应用

## 修复方案

### 已修复的内容

1. **Dockerfile**：
   - 添加了 `ARG` 和 `ENV` 声明，在构建阶段提供 `NEXT_PUBLIC_*` 变量

2. **docker-compose.yml**：
   - 在 `build.args` 中提供构建时需要的变量
   - 移除了未使用的 `GOOGLE_CLIENT_SECRET`
   - 保留了 `NEXTAUTH_*` 变量（如果将来需要使用 NextAuth）

## 配置要求

### 必需的环境变量

#### 构建时（Build-time）

这些变量必须在构建时提供，通过 `docker-compose.yml` 的 `build.args` 传递：

```yaml
build:
  args:
    - NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
    - NEXT_PUBLIC_API_URL=http://localhost:8080
```

#### 运行时（Runtime）

这些变量在容器运行时提供：

```yaml
environment:
  - NEXTAUTH_URL=http://localhost:3000
  - NEXTAUTH_SECRET=your-secret-key
```

### 配置方式

#### 方式 1: 使用环境变量文件（推荐）

创建 `.env.local` 文件：

```env
# Build-time variables (NEXT_PUBLIC_*)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_API_URL=http://localhost:8080

# Runtime variables
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
```

docker-compose.yml 会自动读取 `.env.local` 文件。

#### 方式 2: 使用系统环境变量

在运行 docker-compose 前设置：

```bash
export NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
export NEXT_PUBLIC_API_URL=http://localhost:8080
export NEXTAUTH_URL=http://localhost:3000
export NEXTAUTH_SECRET=your-secret-key

docker-compose up -d
```

#### 方式 3: 在 docker-compose.override.yml 中配置

创建 `docker-compose.override.yml`：

```yaml
version: '3.8'

services:
  hyperliquid-manager:
    build:
      args:
        - NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
        - NEXT_PUBLIC_API_URL=http://localhost:8080
    environment:
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-key
```

## 验证配置

### 检查构建时变量

构建镜像时，确保变量被正确传递：

```bash
docker-compose build --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=test-id hyperliquid-manager
```

### 检查运行时变量

查看容器环境变量：

```bash
docker-compose exec hyperliquid-manager env | grep -E "NEXT_PUBLIC|NEXTAUTH"
```

### 检查客户端代码

构建后，检查生成的代码中是否包含环境变量：

```bash
docker-compose build hyperliquid-manager
docker-compose run --rm hyperliquid-manager cat .next/static/chunks/*.js | grep -i "google"
```

## 注意事项

1. **`GOOGLE_CLIENT_SECRET` 不需要**：
   - 代码中没有使用这个变量
   - 前端只需要 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - 后端验证在 Backend 服务中完成

2. **`NEXTAUTH_*` 变量**：
   - 虽然项目依赖了 `next-auth`，但当前代码中似乎没有使用
   - 如果将来需要使用 NextAuth，这些变量是必需的

3. **构建缓存**：
   - 如果修改了 `NEXT_PUBLIC_*` 变量，需要重新构建镜像：
     ```bash
     docker-compose build --no-cache hyperliquid-manager
     ```

4. **生产环境**：
   - 确保使用强密码和安全的密钥
   - 不要将 `.env.local` 提交到版本控制
   - 使用 Docker secrets 或环境变量管理工具

## 总结

✅ **需要配置的变量：**
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - 必需（构建时）
- `NEXT_PUBLIC_API_URL` - 必需（构建时，有默认值）
- `NEXTAUTH_URL` - 可选（运行时，有默认值）
- `NEXTAUTH_SECRET` - 可选（运行时，如果使用 NextAuth）

❌ **不需要配置的变量：**
- `GOOGLE_CLIENT_ID` - 已移除（应使用 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`）
- `GOOGLE_CLIENT_SECRET` - 代码中未使用
