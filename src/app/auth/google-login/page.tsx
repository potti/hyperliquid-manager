'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, Typography, Alert, Spin, Button, Divider } from 'antd'
import { RocketOutlined, WalletOutlined } from '@ant-design/icons'
import { BrowserProvider } from 'ethers'

const { Title, Paragraph } = Typography

function GoogleLoginContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)
  const scriptLoaded = useRef(false)

  const handleCredentialResponse = useCallback(async (response: any) => {
    setLoading(true)
    setError(null)

    try {
      // 获取 Google 返回的 JWT credential
      const credential = response.credential

      console.log('Google 登录成功，credential 长度:', credential.length)

      // 调用后端验证接口，发送完整的 credential
      // 后端会验证这个 credential 的真实性
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const verifyResponse = await fetch(`${backendUrl}/api/v1/auth/google/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credential,  // 发送完整的 JWT credential
        }),
      })

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({}))
        throw new Error(errorData.message || '后端验证失败')
      }

      const data = await verifyResponse.json()
      
      // 存储 token 到 localStorage
      localStorage.setItem('auth_token', data.data.token)
      localStorage.setItem('user', JSON.stringify(data.data.user))

      console.log('登录成功，用户:', data.data.user.email)
      console.log('跳转到:', callbackUrl)

      // 跳转到目标页面 - 使用 window.location 确保可靠跳转
      window.location.href = callbackUrl
    } catch (err: any) {
      console.error('登录失败:', err)
      setError(err.message || '登录失败，请重试')
      setLoading(false)
    }
  }, [callbackUrl])

  // 钱包登录处理
  const handleWalletLogin = useCallback(async () => {
    setWalletLoading(true)
    setError(null)

    try {
      // 检查是否安装了钱包
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('请先安装 MetaMask 或其他以太坊钱包')
      }

      const ethereum = (window as any).ethereum
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

      // 1. 请求连接钱包
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      if (!accounts || accounts.length === 0) {
        throw new Error('未获取到钱包地址')
      }

      const address = accounts[0].toLowerCase()
      console.log('钱包地址:', address)

      // 2. 从后端获取 nonce
      const nonceResponse = await fetch(`${backendUrl}/api/v1/auth/wallet/nonce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      })

      if (!nonceResponse.ok) {
        const errorData = await nonceResponse.json().catch(() => ({}))
        throw new Error(errorData.message || '获取签名信息失败')
      }

      const nonceData = await nonceResponse.json()
      const { nonce, message } = nonceData.data

      console.log('获取到 nonce:', nonce)

      // 3. 使用钱包签名消息
      const provider = new BrowserProvider(ethereum)
      const signer = await provider.getSigner()
      const signature = await signer.signMessage(message)

      console.log('签名完成:', signature.substring(0, 20) + '...')

      // 4. 发送签名到后端验证
      const verifyResponse = await fetch(`${backendUrl}/api/v1/auth/wallet/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          signature,
          nonce,
        }),
      })

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({}))
        throw new Error(errorData.message || '签名验证失败')
      }

      const data = await verifyResponse.json()

      // 存储 token 到 localStorage
      localStorage.setItem('auth_token', data.data.token)
      localStorage.setItem('user', JSON.stringify(data.data.user))

      console.log('钱包登录成功，用户:', data.data.user.evm_address || data.data.user.uuid)
      console.log('跳转到:', callbackUrl)

      // 跳转到目标页面 - 使用 window.location 确保可靠跳转
      window.location.href = callbackUrl
    } catch (err: any) {
      console.error('钱包登录失败:', err)
      // 处理用户拒绝签名的情况
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setError('您取消了签名请求')
      } else {
        setError(err.message || '钱包登录失败，请重试')
      }
      setWalletLoading(false)
    }
  }, [callbackUrl])

  const initializeGoogleSignIn = useCallback(() => {
    if (typeof window === 'undefined' || !(window as any).google) return

    const google = (window as any).google

    // 初始化 Google Sign-In
    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
    })

    // 渲染登录按钮
    google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      {
        theme: 'filled_blue',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 350,
      }
    )

    // 也可以显示 One Tap prompt（可选）
    // google.accounts.id.prompt()
  }, [handleCredentialResponse])

  useEffect(() => {
    // 加载 Google Identity Services
    if (scriptLoaded.current) return
    scriptLoaded.current = true

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initializeGoogleSignIn
    document.body.appendChild(script)

    return () => {
      // 清理
      const btn = document.getElementById('google-signin-button')
      if (btn) btn.innerHTML = ''
    }
  }, [initializeGoogleSignIn])

  const isLoading = loading || walletLoading

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <Card
        style={{
          maxWidth: 450,
          width: '100%',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          padding: '20px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <RocketOutlined style={{ fontSize: 56, color: '#667eea', marginBottom: 20 }} />
          <Title level={2}>登录管理后台</Title>
          <Paragraph type="secondary">选择您的登录方式</Paragraph>
        </div>

        {error && (
          <Alert
            message="登录失败"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 20 }}
          />
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Spin size="large" tip={walletLoading ? "等待钱包签名..." : "登录中..."} />
          </div>
        ) : (
          <>
            {/* Google 登录按钮 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                minHeight: 50,
                marginBottom: 16,
              }}
            >
              <div id="google-signin-button"></div>
            </div>

            <Divider style={{ margin: '16px 0' }}>
              <span style={{ color: '#999', fontSize: 12 }}>或</span>
            </Divider>

            {/* 钱包登录按钮 */}
            <Button
              type="default"
              size="large"
              icon={<WalletOutlined />}
              onClick={handleWalletLogin}
              disabled={isLoading}
              style={{
                width: '100%',
                height: 50,
                borderRadius: 8,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #f6851b 0%, #e2761b 100%)',
                borderColor: '#e2761b',
                color: '#fff',
              }}
            >
              使用钱包登录
            </Button>
            <Paragraph type="secondary" style={{ fontSize: 12, textAlign: 'center', marginTop: 8, marginBottom: 16 }}>
              支持 MetaMask、OKX Wallet 等主流钱包
            </Paragraph>
          </>
        )}

        <Paragraph type="secondary" style={{ fontSize: 12, textAlign: 'center', marginTop: 16 }}>
          登录即表示您同意我们的服务条款和隐私政策
        </Paragraph>
      </Card>
    </div>
  )
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <Card
        style={{
          maxWidth: 450,
          width: '100%',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          padding: '20px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </Card>
    </div>
  )
}

// Google One Tap 登录（不需要代理）
export default function GoogleLoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GoogleLoginContent />
    </Suspense>
  )
}
