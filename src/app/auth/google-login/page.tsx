'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Typography, Alert, Spin } from 'antd'
import { RocketOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

// Google One Tap 登录（不需要代理）
export default function GoogleLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const scriptLoaded = useRef(false)

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const handleCredentialResponse = async (response: any) => {
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

      // 跳转到目标页面
      router.push(callbackUrl)
    } catch (err: any) {
      console.error('登录失败:', err)
      setError(err.message || '登录失败，请重试')
      setLoading(false)
    }
  }

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
          <Paragraph type="secondary">使用您的 Google 账号登录</Paragraph>
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

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            minHeight: 50,
            marginBottom: 20,
          }}
        >
          {loading ? (
            <Spin size="large" tip="登录中..." />
          ) : (
            <div id="google-signin-button"></div>
          )}
        </div>

        <Paragraph type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
          登录即表示您同意我们的服务条款和隐私政策
        </Paragraph>
      </Card>
    </div>
  )
}

