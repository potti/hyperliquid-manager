'use client'

import { Card, Row, Col, Statistic } from 'antd'
import {
  WalletOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'

interface WalletStats {
  total_wallets: number
  active_wallets: number
  total_balance: number
  total_pnl: number
}

interface WalletOverviewCardsProps {
  stats: WalletStats | null
  loading?: boolean
}

export default function WalletOverviewCards({ stats, loading = false }: WalletOverviewCardsProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card hoverable loading={loading}>
          <Statistic
            title="总钱包数"
            value={stats?.total_wallets ?? 0}
            prefix={<WalletOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card hoverable loading={loading}>
          <Statistic
            title="活跃钱包"
            value={stats?.active_wallets ?? 0}
            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card hoverable loading={loading}>
          <Statistic
            title="总资产"
            value={stats?.total_balance ?? 0}
            precision={2}
            prefix={<DollarOutlined />}
            suffix="USD"
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card hoverable loading={loading}>
          <Statistic
            title="总 PnL"
            value={stats?.total_pnl ?? 0}
            precision={2}
            prefix={
              (stats?.total_pnl ?? 0) >= 0 ? (
                <RiseOutlined style={{ color: '#52c41a' }} />
              ) : (
                <FallOutlined style={{ color: '#ff4d4f' }} />
              )
            }
            suffix="USD"
            valueStyle={{ color: (stats?.total_pnl ?? 0) >= 0 ? '#52c41a' : '#ff4d4f' }}
          />
        </Card>
      </Col>
    </Row>
  )
}
