'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Spin } from 'antd'

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    // 重定向到新的 Google 登录页面
    router.push(`/auth/google-login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }, [router, callbackUrl])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Spin size="large" tip="跳转中..." />
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <Spin size="large" tip="加载中..." />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
