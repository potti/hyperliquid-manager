'use client'

import { Card, Statistic, Typography } from 'antd'
import { ArrowDownOutlined, ArrowUpOutlined, MinusOutlined } from '@ant-design/icons'

export interface ProfitCardProps {
  title: string
  value: React.ReactNode
  subtitle?: string
  trend?: 'up' | 'down' | 'flat'
  loading?: boolean
  precision?: number
  prefix?: string
  suffix?: string
}

export default function ProfitCard({
  title,
  value,
  subtitle,
  trend = 'flat',
  loading,
  precision = 2,
  prefix,
  suffix,
}: ProfitCardProps) {
  const trendColor =
    trend === 'up' ? '#3f8600' : trend === 'down' ? '#cf1322' : undefined
  const trendIcon =
    trend === 'up' ? (
      <ArrowUpOutlined />
    ) : trend === 'down' ? (
      <ArrowDownOutlined />
    ) : (
      <MinusOutlined />
    )

  const isNumber = typeof value === 'number'

  return (
    <Card size="small" loading={loading}>
      <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>{title}</div>
      {isNumber ? (
        <Statistic
          value={value as number}
          precision={precision}
          prefix={prefix}
          suffix={suffix}
          valueStyle={{ color: trendColor, fontSize: 24 }}
        />
      ) : (
        <Typography.Title level={4} style={{ margin: '8px 0 0', color: trendColor }}>
          {prefix}
          {value}
          {suffix}
        </Typography.Title>
      )}
      {subtitle && (
        <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
          {subtitle}
        </div>
      )}
      {trend !== 'flat' && isNumber && (
        <div style={{ marginTop: 4, color: trendColor, fontSize: 12 }}>
          {trendIcon} {trend === 'up' ? '上行' : '下行'}
        </div>
      )}
    </Card>
  )
}
