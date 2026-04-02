'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Card,
  Typography,
  Tag,
  Space,
  Switch,
  Table,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { pmpeApi } from '@/services/pmpe/api'
import type { MappingHealthResponse } from '@/services/pmpe/types'
import { usePMPEWebSocket } from '@/components/prediction-market/hooks/usePMPEWebSocket'

const { Title, Paragraph } = Typography

type AlertRow = {
  key: string
  event: string
  level: 'Warning' | 'Error'
  time: string
}

const mockAlerts: AlertRow[] = [
  {
    key: '1',
    event: '映射失败',
    level: 'Error',
    time: new Date().toLocaleString(),
  },
  {
    key: '2',
    event: '流动性过低',
    level: 'Warning',
    time: new Date().toLocaleString(),
  },
  {
    key: '3',
    event: 'API 超时',
    level: 'Warning',
    time: new Date().toLocaleString(),
  },
]

export default function MonitoringPage() {
  const [health, setHealth] = useState<MappingHealthResponse | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const { lastProfitUpdate, lastNewOpportunity, lastCopyTrade } =
    usePMPEWebSocket(true)

  const addLog = useCallback((line: string) => {
    setLogs((l) => [line, ...l].slice(0, 50))
  }, [])

  useEffect(() => {
    pmpeApi.getMappingHealth().then(setHealth).catch(() => {})
  }, [])

  useEffect(() => {
    if (!lastProfitUpdate) return
    addLog(
      `[Profit] 今日Pnl: $${lastProfitUpdate.today_pnl?.toFixed(2)} | 累计: $${lastProfitUpdate.cumulative_pnl?.toFixed(2)}`
    )
  }, [lastProfitUpdate, addLog])

  useEffect(() => {
    if (!lastNewOpportunity?.opportunity) return
    const o = lastNewOpportunity.opportunity
    addLog(
      `[Arb] 新机会: ${o.event_key} | Spread: ${((o.net_spread ?? 0) * 100).toFixed(2)}%`
    )
  }, [lastNewOpportunity, addLog])

  useEffect(() => {
    if (!lastCopyTrade) return
    addLog(
      `[Copy] 跟单: ${lastCopyTrade.wallet?.slice(0, 8)}... | Side: ${lastCopyTrade.side} | $${lastCopyTrade.amount?.toFixed(2)}`
    )
  }, [lastCopyTrade, addLog])

  const healthStatusColor: Record<string, string> = {
    excellent: 'green',
    good: 'blue',
    fair: 'gold',
    poor: 'red',
  }

  const alertColumns: ColumnsType<AlertRow> = [
    { title: '事件', dataIndex: 'event', key: 'event' },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (lv: string) => (
        <Tag color={lv === 'Error' ? 'red' : 'gold'}>{lv}</Tag>
      ),
    },
    { title: '时间', dataIndex: 'time', key: 'time' },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Title level={4} style={{ marginBottom: 16 }}>
        PolyProfit - 监控告警
      </Title>

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {health && (
          <Card title="映射健康度">
            <Space wrap>
              <Tag color="blue">总市场: {health.total_markets}</Tag>
              <Tag color="green">已映射: {health.mapped_markets}</Tag>
              <Tag color="gold">待审核: {health.needs_review_count}</Tag>
              <Tag color={healthStatusColor[health.health_status] || 'default'}>
                {health.health_status}
              </Tag>
              <span style={{ marginLeft: 8 }}>
                映射率: {(health.mapping_ratio * 100).toFixed(1)}%
              </span>
            </Space>
          </Card>
        )}

        <Card title="实时日志">
          <Paragraph type="secondary" style={{ marginBottom: 8 }}>
            最近 50 条日志（来自 usePMPEWebSocket 模拟推送）
          </Paragraph>
          <div
            style={{
              maxHeight: 300,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: 12,
            }}
          >
            {logs.length === 0 && (
              <span style={{ color: '#999' }}>等待数据...</span>
            )}
            {logs.map((log, i) => (
              <div
                key={`${i}-${log.slice(0, 24)}`}
                style={{
                  padding: '2px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                {log}
              </div>
            ))}
          </div>
        </Card>

        <Card title="告警规则（本地开关）">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Switch defaultChecked size="small" />
              <span>低流动性告警 (Liquidity &lt; $1,000)</span>
            </Space>
            <Space>
              <Switch defaultChecked size="small" />
              <span>映射失败告警</span>
            </Space>
            <Space>
              <Switch defaultChecked size="small" />
              <span>API 超时告警</span>
            </Space>
          </Space>
        </Card>

        <Card title="告警列表（示例数据）">
          <Table<AlertRow>
            rowKey="key"
            size="small"
            pagination={false}
            columns={alertColumns}
            dataSource={mockAlerts}
          />
        </Card>
      </Space>
    </div>
  )
}
