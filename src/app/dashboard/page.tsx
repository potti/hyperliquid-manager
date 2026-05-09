'use client'

import { useState, useEffect } from 'react'
import { Card, Typography, Row, Col, Statistic, Space, Avatar, Spin } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/contexts/AuthContext'
import { walletApi } from '@/lib/api-client'

const { Title } = Typography

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await walletApi.getStats()
      if (res?.success) {
        setStats(res.data)
      }
    } catch (err) {
      console.error('Failed to load wallet stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalPnl = stats?.total_pnl ?? 0
  const isPnlPositive = totalPnl >= 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space>
            <Avatar size={64} icon={<UserOutlined />} />
            <div>
              <Title level={3} style={{ margin: 0 }}>
                欢迎回来, {user?.name}
              </Title>
              <p style={{ color: '#666', margin: 0 }}>{user?.email}</p>
            </div>
          </Space>
        </Card>

        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总钱包数"
                  value={stats?.total_wallets ?? 0}
                  prefix={<WalletOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="活跃钱包"
                  value={stats?.active_wallets ?? 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总资产"
                  value={stats?.total_hl_value ?? 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#faad14' }}
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总 PnL"
                  value={totalPnl}
                  prefix={isPnlPositive ? <RiseOutlined /> : <FallOutlined />}
                  valueStyle={{ color: isPnlPositive ? '#3f8600' : '#cf1322' }}
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                />
              </Card>
            </Col>
          </Row>
        </Spin>

        <Card title="系统概览">
          {stats?.total_wallets > 0 ? (
            <p>
              系统正在管理 {stats.total_wallets} 个钱包，其中 {stats.active_wallets ?? 0} 个活跃。
              {stats.predict_registered > 0 && `Predict.fun 已注册 ${stats.predict_registered} 个。`}
            </p>
          ) : (
            <p>暂无钱包数据，前往钱包管理页面创建您的第一个钱包。</p>
          )}
        </Card>
      </Space>
  )
}

