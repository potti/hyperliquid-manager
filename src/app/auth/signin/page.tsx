'use client'

import { signIn } from 'next-auth/react'
import { Button, Card, Typography, Space, Divider, Alert } from 'antd'
import { GoogleOutlined, RocketOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function SignIn() {
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        style={{
          maxWidth: 450,
          width: '100%',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          padding: '20px'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <RocketOutlined style={{ fontSize: 56, color: '#667eea', marginBottom: 20 }} />
            <Title level={2}>登录管理后台</Title>
            <Paragraph type="secondary">
              使用您的 Google 账号登录
            </Paragraph>
          </div>

          <Alert
            message="温馨提示"
            description="如果在国内访问 Google 登录失败，请确保已配置代理并使用代理启动脚本。"
            type="info"
            showIcon
            style={{ textAlign: 'left' }}
          />

          <Divider />

          <Button
            type="primary"
            size="large"
            icon={<GoogleOutlined />}
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              height: 50,
              fontSize: 16,
              borderRadius: 8
            }}
          >
            使用 Google 账号登录
          </Button>

          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            登录即表示您同意我们的服务条款和隐私政策
          </Paragraph>
        </Space>
      </Card>
    </div>
  )
}

