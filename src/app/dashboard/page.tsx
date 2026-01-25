'use client'

import { Card, Typography, Row, Col, Statistic, Space, Avatar } from 'antd'
import { UserOutlined, TeamOutlined, RiseOutlined, DollarOutlined } from '@ant-design/icons'
import { useAuth } from '@/contexts/AuthContext'

const { Title } = Typography

export default function Dashboard() {
  const { user } = useAuth()

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

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={1128}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="活跃用户"
                value={893}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="增长率"
                value={11.28}
                prefix={<RiseOutlined />}
                suffix="%"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总收入"
                value={9280}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="系统概览">
          <p>这是您的管理后台主页。您可以在这里查看系统的整体运行状况。</p>
          <p>左侧菜单提供了各种管理功能的入口。</p>
        </Card>
      </Space>
  )
}

