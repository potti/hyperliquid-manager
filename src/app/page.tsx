'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Typography, Space, Row, Col } from 'antd'
import { RocketOutlined, UserOutlined, SafetyOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function Home() {
  const router = useRouter()

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
          maxWidth: 1000,
          width: '100%',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <RocketOutlined style={{ fontSize: 64, color: '#667eea', marginBottom: 20 }} />
          <Title level={1} style={{ marginBottom: 16 }}>
            欢迎使用 Hyperliquid Manager
          </Title>
          <Paragraph style={{ fontSize: 18, color: '#666' }}>
            强大的管理后台系统，助您轻松管理业务
          </Paragraph>
        </div>

        <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
          <Col xs={24} md={8}>
            <Card hoverable style={{ textAlign: 'center', height: '100%' }}>
              <UserOutlined style={{ fontSize: 40, color: '#1890ff', marginBottom: 16 }} />
              <Title level={4}>用户管理</Title>
              <Paragraph>完善的用户权限管理系统</Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card hoverable style={{ textAlign: 'center', height: '100%' }}>
              <SafetyOutlined style={{ fontSize: 40, color: '#52c41a', marginBottom: 16 }} />
              <Title level={4}>安全可靠</Title>
              <Paragraph>企业级安全保障</Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card hoverable style={{ textAlign: 'center', height: '100%' }}>
              <RocketOutlined style={{ fontSize: 40, color: '#fa8c16', marginBottom: 16 }} />
              <Title level={4}>高效便捷</Title>
              <Paragraph>现代化的交互体验</Paragraph>
            </Card>
          </Col>
        </Row>

        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            onClick={() => router.push('/auth/signin')}
            style={{
              height: 50,
              fontSize: 18,
              minWidth: 200,
              borderRadius: 8
            }}
          >
            立即登录
          </Button>
          <Paragraph type="secondary">
            使用 Google 账号快速登录
          </Paragraph>
        </Space>
      </Card>
    </div>
  )
}

