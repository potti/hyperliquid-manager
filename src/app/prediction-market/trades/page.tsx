'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Table,
  Select,
  DatePicker,
  Tag,
  Space,
  Button,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { DownloadOutlined } from '@ant-design/icons'
import { pmpeApi } from '@/services/pmpe/api'
import type { ArbOpportunity, PMMarket } from '@/services/pmpe/types'
const { Title } = Typography
const { RangePicker } = DatePicker

type PnlFilter = '' | 'win' | 'loss' | 'open'

function rowKey(r: ArbOpportunity) {
  return r.id ?? `${r.event_key}-${r.created_at}-${r.status}`
}

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export default function TradesPage() {
  const [data, setData] = useState<ArbOpportunity[]>([])
  const [marketTitles, setMarketTitles] = useState<Map<string, string>>(
    new Map()
  )
  const [loading, setLoading] = useState(false)
  const [strategy, setStrategy] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [pnlFilter, setPnlFilter] = useState<PnlFilter>('')
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [newRes, execRes, filledRes] = await Promise.all([
        pmpeApi.listArbOpportunities({ status: 'new', limit: 80 }),
        pmpeApi.listArbOpportunities({ status: 'executing', limit: 80 }),
        pmpeApi.listArbOpportunities({ status: 'filled', limit: 80 }),
      ])
      const merged = [
        ...(newRes.opportunities ?? []),
        ...(execRes.opportunities ?? []),
        ...(filledRes.opportunities ?? []),
      ]
      const seen = new Set<string>()
      const items: ArbOpportunity[] = []
      for (const o of merged) {
        const k = rowKey(o)
        if (seen.has(k)) continue
        seen.add(k)
        items.push(o)
      }
      setData(items)

      const marketsRes = await pmpeApi
        .listMarkets({ active: true, limit: 500 })
        .catch(() => ({ markets: [] as PMMarket[] }))
      const m = new Map<string, string>()
      for (const x of marketsRes.markets ?? []) {
        m.set(x.event_key, x.event_title)
      }
      setMarketTitles(m)
    } catch {
      message.error('加载失败')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    let items = data
    if (strategy === 'copy') {
      items = []
    } else if (strategy === 'arb') {
      items = data
    }
    if (status) items = items.filter((i) => i.status === status)
    if (range?.[0] && range[1]) {
      const start = range[0].startOf('day').unix()
      const end = range[1].endOf('day').unix()
      items = items.filter((i) => i.created_at >= start && i.created_at <= end)
    }
    if (pnlFilter === 'win') {
      items = items.filter((i) => (i.net_spread ?? 0) > 0)
    } else if (pnlFilter === 'loss') {
      items = items.filter((i) => (i.net_spread ?? 0) < 0)
    } else if (pnlFilter === 'open') {
      items = items.filter((i) => i.status === 'new' || i.status === 'executing')
    }
    return items
  }, [data, strategy, status, range, pnlFilter])

  const exportCsv = () => {
    const headers = [
      'id',
      'event_key',
      'market_title',
      'strategy',
      'direction',
      'net_spread_pct',
      'status',
      'created_at',
    ]
    const lines = [
      headers.join(','),
      ...filtered.map((r) =>
        [
          csvEscape(rowKey(r)),
          csvEscape(r.event_key),
          csvEscape(marketTitles.get(r.event_key) ?? ''),
          csvEscape('arb'),
          csvEscape(r.direction ?? ''),
          csvEscape(String((r.net_spread ?? 0) * 100)),
          csvEscape(r.status ?? ''),
          csvEscape(new Date(r.created_at * 1000).toISOString()),
        ].join(',')
      ),
    ]
    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pmpe-trades-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    message.success('已导出 CSV')
  }

  const columns: ColumnsType<ArbOpportunity> = [
    {
      title: '交易ID',
      key: 'id',
      width: 120,
      ellipsis: true,
      render: (_, r) => {
        const k = rowKey(r)
        return k.length > 18 ? `${k.slice(0, 10)}…${k.slice(-4)}` : k
      },
    },
    {
      title: '市场名称',
      key: 'title',
      ellipsis: true,
      render: (_, r) => marketTitles.get(r.event_key) ?? r.event_key,
    },
    {
      title: '策略',
      key: 'strategy',
      render: () => <Tag color="blue">套利</Tag>,
    },
    {
      title: '方向',
      dataIndex: 'direction',
      key: 'direction',
      render: (d: string) => <Tag>{d}</Tag>,
    },
    {
      title: '金额(估)',
      key: 'amt',
      render: (_, r) => `$${((r.net_spread ?? 0) * 1000).toFixed(2)}`,
    },
    {
      title: '进场(净Spread)',
      dataIndex: 'net_spread',
      key: 'net_spread',
      render: (v: number) => (
        <span style={{ color: (v ?? 0) >= 0.03 ? '#3f8600' : undefined }}>
          {((v ?? 0) * 100).toFixed(2)}%
        </span>
      ),
    },
    {
      title: '盈亏',
      key: 'pnl',
      render: (_, r) => {
        const v = r.net_spread ?? 0
        if (r.status === 'new' || r.status === 'executing') {
          return <span style={{ color: '#888' }}>open</span>
        }
        if (v > 0)
          return <span style={{ color: '#3f8600' }}>win</span>
        if (v < 0)
          return <span style={{ color: '#cf1322' }}>loss</span>
        return <span style={{ color: '#888' }}>—</span>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const colors: Record<string, string> = {
          new: 'green',
          executing: 'blue',
          filled: 'cyan',
          failed: 'red',
          settled: 'purple',
        }
        return <Tag color={colors[s] || 'default'}>{s}</Tag>
      },
    },
    {
      title: 'TxHash',
      key: 'tx',
      width: 100,
      render: () => <span style={{ color: '#999' }}>—</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (t: number) => new Date(t * 1000).toLocaleString(),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Title level={4} style={{ marginBottom: 16 }}>
        PolyProfit - 交易历史
      </Title>

      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="策略类型"
          allowClear
          style={{ width: 140 }}
          value={strategy || undefined}
          onChange={(v) => setStrategy(v ?? '')}
          options={[
            { value: 'copy', label: '跟单' },
            { value: 'arb', label: '套利' },
          ]}
        />
        <RangePicker
          value={range}
          onChange={(v) => setRange(v as [Dayjs | null, Dayjs | null] | null)}
        />
        <Select
          placeholder="盈亏状态"
          allowClear
          style={{ width: 120 }}
          value={pnlFilter || undefined}
          onChange={(v) => setPnlFilter((v as PnlFilter) ?? '')}
          options={[
            { value: 'win', label: '盈' },
            { value: 'loss', label: '亏' },
            { value: 'open', label: 'open' },
          ]}
        />
        <Select
          placeholder="状态"
          allowClear
          style={{ width: 120 }}
          value={status || undefined}
          onChange={(v) => setStatus(v ?? '')}
          options={[
            { value: 'new', label: '新' },
            { value: 'executing', label: '执行中' },
            { value: 'filled', label: '已执行' },
            { value: 'settled', label: '已结算' },
            { value: 'failed', label: '失败' },
          ]}
        />
        <Button onClick={loadData}>刷新</Button>
        <Button icon={<DownloadOutlined />} onClick={exportCsv}>
          导出 CSV
        </Button>
      </Space>

      {strategy === 'copy' && (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
          跟单交易历史需后端 <code>/api/pmpe/trades</code>；当前仅展示套利相关记录。
        </Typography.Paragraph>
      )}

      <Table<ArbOpportunity>
        columns={columns}
        dataSource={filtered}
        rowKey={rowKey}
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1100 }}
      />
    </div>
  )
}
