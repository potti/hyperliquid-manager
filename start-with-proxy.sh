#!/bin/bash

# 使用代理启动开发服务器（解决 Google OAuth 网络问题）

echo "=========================================="
echo "  Hyperliquid Manager - 代理启动脚本"
echo "=========================================="
echo ""

# 释放 3000 端口
echo "检查并释放 3000 端口..."
kill -9 $(lsof -ti:3000) 2>/dev/null && echo "✅ 端口已释放" || echo "✅ 端口未被占用"
echo ""

# 默认代理配置（根据你的代理工具调整）
PROXY_HOST="127.0.0.1"
PROXY_PORT="7897"  # Clash 常用端口: 7890/7897, V2Ray/SS: 1080

# 检查是否传入自定义端口
if [ ! -z "$1" ]; then
    PROXY_PORT="$1"
    echo "使用自定义代理端口: $PROXY_PORT"
fi

PROXY_URL="http://${PROXY_HOST}:${PROXY_PORT}"

echo "代理配置:"
echo "  HTTP_PROXY=$PROXY_URL"
echo "  HTTPS_PROXY=$PROXY_URL"
echo ""

# 测试代理是否可用
echo "测试代理连接..."
if curl -x "$PROXY_URL" -s --connect-timeout 3 https://www.google.com > /dev/null 2>&1; then
    echo "✅ 代理连接成功"
else
    echo "⚠️  代理连接失败，请检查："
    echo "   1. 代理工具是否已启动（Clash/V2Ray/Shadowsocks）"
    echo "   2. 端口是否正确（默认 7890，可通过参数指定）"
    echo "   3. 使用方式: ./start-with-proxy.sh [端口号]"
    echo ""
    echo "常见代理端口："
    echo "   - Clash: 7890"
    echo "   - V2Ray: 1080"
    echo "   - Shadowsocks: 1080"
    echo ""
    read -p "是否继续启动？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "=================================="
echo "启动开发服务器..."
echo "=================================="
echo ""

cd /Users/potti/mywork-workspace/hyperliquid-manager

# 使用代理启动
HTTP_PROXY="$PROXY_URL" \
HTTPS_PROXY="$PROXY_URL" \
npm run dev

