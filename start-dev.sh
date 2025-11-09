#!/bin/bash

# Hyperliquid Manager 开发启动脚本

echo "=================================="
echo "Hyperliquid Manager 启动脚本"
echo "=================================="
echo ""

# 检查 Node.js 版本
echo "检查 Node.js 版本..."
node --version
npm --version
echo ""

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "检测到未安装依赖，开始安装..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装成功"
else
    echo "✅ 依赖已存在"
fi

echo ""
echo "检查环境变量配置..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  警告: .env.local 文件不存在"
    echo "请创建 .env.local 文件并配置以下变量："
    echo ""
    echo "NEXTAUTH_URL=http://localhost:3000"
    echo "NEXTAUTH_SECRET=your-secret-key"
    echo "GOOGLE_CLIENT_ID=your-google-client-id"
    echo "GOOGLE_CLIENT_SECRET=your-google-client-secret"
    echo ""
    echo "详细配置步骤请参考 SETUP.md"
    echo ""
else
    echo "✅ 环境变量文件存在"
fi

echo ""
echo "=================================="
echo "启动开发服务器..."
echo "=================================="
echo ""
echo "访问地址: http://localhost:3000"
echo "按 Ctrl+C 停止服务器"
echo ""

npm run dev

