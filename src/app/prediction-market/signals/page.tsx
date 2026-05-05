'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Card,
  Col,
  Row,
  Select,
  Button,
  Table,
  Tag,
  Statistic,
  Space,
  Empty,
  message,
  Tabs,
  Tooltip,
  Typography,
} from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { signalApi } from '@/services/signals/api'
import type { SignalLog, ConflictRecord, SignalStats } from '@/services/signals/types'

const { Text } = Typography

const sourceColor: Record<string, string> = {
  chanlun: 'purple',
  whale: 'blue',
  rule: 'orange',
}

const directionColor: Record<string, string> = {
  buy: 'green',
  long: 'green',
  sell: 'red',
  short: 'red',
}

const signalColumns: ColumnsType<SignalLog> = [
  {
    title: 'Time',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
    render: (v: string) => new Date(v).toLocaleString(),
  },
  {
    title: 'Source',
    dataIndex: 'source',
    key: 'source',
    width: 90,
    render: (s: string) => <Tag color={sourceColor[s] || 'default'}>{s}</Tag>,
  },
  {
    title: 'Symbol',
    dataIndex: 'symbol',
    key: 'symbol',
    width: 70,
  },
  {
    title: 'Direction',
    dataIndex: 'direction',
    key: 'direction',
    width: 70,
    render: (d: string) => <Tag color={directionColor[d] || 'default'}>{d}</Tag>,
  },
  {
    title: 'Strength',
    dataIndex: 'strength',
    key: 'strength',
    width: 80,
    render: (v: number) => (v * 100).toFixed(0) + '%',
  },
  {
    title: 'Tracks',
    key: 'tracks',
    width: 180,
    render: (_: any, record: SignalLog) => {
      if (!record.tracks || record.tracks.length === 0) {
        return <Text type="secondary">no markets matched</Text>
      }
      return (
        <Space wrap size={[0, 4]}>
          {record.tracks.slice(0, 2).map((t) => (
            <Tooltip
              key={t.id}
              title={
                <div>
                  <div>1h: {t.correct_1h != null ? (t.correct_1h ? '✓ correct' : '✗ wrong') : 'pending'}</div>
                  <div>6h: {t.correct_6h != null ? (t.correct_6h ? '✓ correct' : '✗ wrong') : 'pending'}</div>
                  <div>24h: {t.correct_24h != null ? (t.correct_24h ? '✓ correct' : '✗ wrong') : 'pending'}</div>
                </div>
              }
            >
              <Tag color={t.status === 'resolved' ? 'green' : t.status === 'partial' ? 'blue' : 'default'} style={{ cursor: 'pointer' }}>
                #{t.market_id}
              </Tag>
            </Tooltip>
          ))}
          {record.tracks.length > 2 && <Text type="secondary">+{record.tracks.length - 2}</Text>}
        </Space>
      )
    },
  },
]

const conflictColumns: ColumnsType<ConflictRecord> = [
  {
    title: 'Time',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
    render: (v: string) => new Date(v).toLocaleString(),
  },
  {
    title: 'Symbol',
    dataIndex: 'symbol',
    key: 'symbol',
    width: 70,
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  {
    title: 'Winner',
    dataIndex: 'resolved_a',
    key: 'resolved_a',
    width: 100,
    render: (v: boolean | undefined) =>
      v != null ? (v ? 'Signal A' : 'Signal B') : <Text type="secondary">unresolved</Text>,
  },
]

export default function SignalsPage() {
  const [signals, setSignals] = useState<SignalLog[]>([])
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([])
  const [stats, setStats] = useState<SignalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState<string | undefined>()
  const [symbolFilter, setSymbolFilter] = useState<string | undefined>()

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [sigRes, confRes, statRes] = await Promise.all([
        signalApi.getSignals({ source: sourceFilter, symbol: symbolFilter, limit: 100 }),
        signalApi.getConflicts({ limit: 50 }),
        signalApi.getStats(),
      ])
      setSignals(sigRes ?? [])
      setConflicts(confRes ?? [])
      setStats(statRes)
    } catch {
      message.warning('Failed to load signals')
    } finally {
      setLoading(false)
    }
  }, [sourceFilter, symbolFilter])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const formatRate = (rate: number) => (rate * 100).toFixed(1) + '%'

  return (
    <div>
      {/* Filter bar */}
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Select
            placeholder="All sources"
            style={{ width: 140 }}
            allowClear
            value={sourceFilter}
            onChange={setSourceFilter}
            options={[
              { label: 'Chanlun', value: 'chanlun' },
              { label: 'Whale', value: 'whale' },
              { label: 'Rule', value: 'rule' },
            ]}
          />
        </Col>
        <Col>
          <Select
            placeholder="All symbols"
            style={{ width: 120 }}
            allowClear
            value={symbolFilter}
            onChange={setSymbolFilter}
            options={[
              { label: 'BTC', value: 'BTC' },
              { label: 'ETH', value: 'ETH' },
              { label: 'SOL', value: 'SOL' },
              { label: 'HYPE', value: 'HYPE' },
            ]}
          />
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={loadAll}>
            Refresh
          </Button>
        </Col>
      </Row>

      {/* Stats cards */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {['chanlun', 'whale', 'rule'].map((source) => {
            const key24 = `${source}_24h`
            const key6 = `${source}_6h`
            const key1 = `${source}_1h`
            const stat24 = stats[key24] as { total: number; correct: number; rate: number } | undefined
            const stat6 = stats[key6] as { total: number; correct: number; rate: number } | undefined
            const stat1 = stats[key1] as { total: number; correct: number; rate: number } | undefined
            if (!stat24 && !stat6 && !stat1) return null
            return (
              <Col span={8} key={source}>
                <Card
                  size="small"
                  title={<Tag color={sourceColor[source]}>{source}</Tag>}
                >
                  <Row gutter={8}>
                    <Col span={8}>
                      <Statistic
                        title="1h accuracy"
                        value={stat1 ? formatRate(stat1.rate) : '-'}
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="6h accuracy"
                        value={stat6 ? formatRate(stat6.rate) : '-'}
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="24h accuracy"
                        value={stat24 ? formatRate(stat24.rate) : '-'}
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}

      {/* Main content: signals + conflicts tabs */}
      <Card>
        <Tabs
          defaultActiveKey="signals"
          items={[
            {
              key: 'signals',
              label: `Signals (${signals.length})`,
              children: signals.length === 0 && !loading ? (
                <Empty description="No signals recorded yet. Signals will appear here as they are received from TradingView or whale WebSocket." />
              ) : (
                <Table
                  columns={signalColumns}
                  dataSource={signals}
                  size="small"
                  loading={loading}
                  pagination={{ pageSize: 20 }}
                  rowKey="id"
                  scroll={{ x: 700 }}
                />
              ),
            },
            {
              key: 'conflicts',
              label: `Conflicts (${conflicts.length})`,
              children: conflicts.length === 0 ? (
                <Empty description="No signal conflicts detected. Conflicts appear when opposite signals fire within 1 hour." />
              ) : (
                <Table
                  columns={conflictColumns}
                  dataSource={conflicts}
                  size="small"
                  pagination={{ pageSize: 20 }}
                  rowKey="id"
                  scroll={{ x: 500 }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
