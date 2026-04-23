'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Table,
  Typography,
  Select,
  Button,
  Modal,
  message,
  Space,
  Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { pmpeApi } from '@/services/pmpe/api'
import type { ArbOpportunity, PMMarket } from '@/services/pmpe/types'
import SpreadFilter from '@/components/prediction-market/SpreadFilter'
import { usePMPEWebSocket } from '@/components/prediction-market/hooks/usePMPEWebSocket'

type PlatformFilter = 'all' | 'polymarket' | 'kalshi' | 'predict'
type StatusFilter = 'all' | 'new' | 'executing' | 'filled'

function legPrice(
  opp: ArbOpportunity,
  venue: 'polymarket' | 'kalshi' | 'predict',
  side: 'YES' | 'NO'
): number {
  const legs = [opp.legs.leg_a, opp.legs.leg_b]
  const hit = legs.find((l) => l.venue === venue && l.side === side)
  return hit?.price ?? 0
}

function hasVenueLeg(opp: ArbOpportunity, venue: string): boolean {
  return opp.legs.leg_a.venue === venue || opp.legs.leg_b.venue === venue
}

function eventTitleFromMarket(
  eventKey: string,
  map: Map<string, PMMarket>
): string {
  return map.get(eventKey)?.event_title || eventKey
}

function liquidityLabel(eventKey: string, map: Map<string, PMMarket>): string {
  const m = map.get(eventKey)
  if (!m) return '—'
  const p = m.liquidity?.poly ?? 0
  const k = m.liquidity?.kalshi ?? 0
  const pr = m.liquidity?.predict ?? 0
  return `P:${p.toFixed(0)} / K:${k.toFixed(0)} / Pred:${pr.toFixed(0)}`
}

export default function ArbitragePage() {
  const [minSpread, setMinSpread] = useState(0.03)
  const [platform, setPlatform] = useState<PlatformFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('new')
  const [opps, setOpps] = useState<ArbOpportunity[]>([])
  const [marketMap, setMarketMap] = useState<Map<string, PMMarket>>(new Map())
  const [loading, setLoading] = useState(true)
  const [flashKey, setFlashKey] = useState<string | null>(null)

  const { connected, lastNewOpportunity } = usePMPEWebSocket(true)

  const loadMarkets = useCallback(async () => {
    try {
      const res = await pmpeApi.listMarkets({ active: true, limit: 500 })
      const m = new Map<string, PMMarket>()
      for (const x of res.markets ?? []) {
        m.set(x.event_key, x)
      }
      setMarketMap(m)
    } catch {
      setMarketMap(new Map())
    }
  }, [])

  const loadOpps = useCallback(async () => {
    setLoading(true)
    try {
      if (statusFilter === 'all') {
        const [a, b, c] = await Promise.all([
          pmpeApi.listArbOpportunities({ status: 'new', limit: 80 }),
          pmpeApi.listArbOpportunities({ status: 'executing', limit: 80 }),
          pmpeApi.listArbOpportunities({ status: 'filled', limit: 80 }),
        ])
        const merged = [
          ...(a.opportunities ?? []),
          ...(b.opportunities ?? []),
          ...(c.opportunities ?? []),
        ]
        const seen = new Set<string>()
        const dedup: ArbOpportunity[] = []
        for (const o of merged) {
          const k = o.id ?? `${o.event_key}-${o.created_at}-${o.status}`
          if (seen.has(k)) continue
          seen.add(k)
          dedup.push(o)
        }
        setOpps(dedup)
      } else {
        const res = await pmpeApi.listArbOpportunities({
          status: statusFilter,
          limit: 150,
        })
        setOpps(res.opportunities ?? [])
      }
    } catch {
      message.warning('加载套利机会失败')
      setOpps([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadMarkets()
  }, [loadMarkets])

  useEffect(() => {
    loadOpps()
  }, [loadOpps])

  useEffect(() => {
    if (!lastNewOpportunity?.opportunity) return
    const o = lastNewOpportunity.opportunity
    setOpps((prev) => {
      const oid = o.id
      const next = [
        o,
        ...prev.filter((x) =>
          oid ? x.id !== oid : x.event_key !== o.event_key || x.created_at !== o.created_at
        ),
      ]
      return next.slice(0, 120)
    })
    const fk = o.id ?? `${o.event_key}-${o.created_at}`
    setFlashKey(fk)
    const t = setTimeout(() => setFlashKey(null), 4000)
    return () => clearTimeout(t)
  }, [lastNewOpportunity])

  const filtered = useMemo(() => {
    return opps.filter((o) => {
      if ((o.net_spread ?? 0) < minSpread) return false
      if (platform === 'all') return true
      const hasPoly = o.legs.leg_a.venue === 'polymarket' || o.legs.leg_b.venue === 'polymarket'
      const hasKalshi = o.legs.leg_a.venue === 'kalshi' || o.legs.leg_b.venue === 'kalshi'
      const hasPredict = o.legs.leg_a.venue === 'predict' || o.legs.leg_b.venue === 'predict'
      if (platform === 'polymarket') return hasPoly
      if (platform === 'kalshi') return hasKalshi
      if (platform === 'predict') return hasPredict
      return true
    })
  }, [opps, minSpread, platform])

  const stats = useMemo(() => {
    const startDay = new Date()
    startDay.setHours(0, 0, 0, 0)
    const startWeek = new Date()
    startWeek.setDate(startWeek.getDate() - 7)
    const todayTs = Math.floor(startDay.getTime() / 1000)
    const weekTs = Math.floor(startWeek.getTime() / 1000)

    let today = 0
    let weekProfit = 0
    for (const o of opps) {
      if (o.created_at >= todayTs) today += 1
      if (o.created_at >= weekTs)
        weekProfit += (o.net_spread ?? 0) * 1000
    }
    const active = opps.filter((o) => o.status === 'new' || o.status === 'executing').length
    return { today, weekProfit, active }
  }, [opps])

  const columns: ColumnsType<ArbOpportunity> = [
    {
      title: '事件',
      key: 'title',
      ellipsis: true,
      render: (_, r) => eventTitleFromMarket(r.event_key, marketMap),
    },
    {
      title: 'Poly YES',
      key: 'py',
      render: (_, r) => legPrice(r, 'polymarket', 'YES').toFixed(4),
    },
    {
      title: 'Kalshi NO',
      key: 'kn',
      render: (_, r) => legPrice(r, 'kalshi', 'NO').toFixed(4),
    },
    {
      title: 'Predict YES',
      key: 'pry',
      render: (_, r) => legPrice(r, 'predict', 'YES').toFixed(4),
    },
    {
      title: 'Spread(净)',
      dataIndex: 'net_spread',
      render: (v: number) => (
        <Typography.Text style={{ color: '#3f8600', fontWeight: 600 }}>
          {((v ?? 0) * 100).toFixed(2)}%
        </Typography.Text>
      ),
    },
    {
      title: '预计锁定利润',
      key: 'lock',
      render: (_, r) => `$${((r.net_spread ?? 0) * 1000).toFixed(2)}`,
    },
    {
      title: '流动性',
      key: 'liq',
      render: (_, r) => liquidityLabel(r.event_key, marketMap),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => <Tag>{s}</Tag>,
    },
    {
      title: '操作',
      key: 'act',
      render: (_, r) => (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            Modal.confirm({
              title: '确认执行套利？',
              content: `事件：${r.event_key}，净价差 ${((r.net_spread ?? 0) * 100).toFixed(2)}%`,
              onOk: () => {
                message.success('已提交执行请求（待对接后端）')
              },
            })
          }}
        >
          立即执行
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        PolyProfit - 套利机会扫描
      </Typography.Title>
      <Typography.Text type="secondary">
        实时通道：{connected ? '已连接(模拟)' : '连接中…'}
      </Typography.Text>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">今日套利次数</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {stats.today}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">本周锁定利润(估算)</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>
              ${stats.weekProfit.toFixed(2)}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">当前活跃机会</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {stats.active}
            </Typography.Title>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Space wrap size="large" align="start">
          <div style={{ minWidth: 220 }}>
            <SpreadFilter minSpread={minSpread} onChange={setMinSpread} />
          </div>
          <div>
            <Typography.Text strong>平台</Typography.Text>
            <Select<PlatformFilter>
              style={{ width: 140, display: 'block', marginTop: 8 }}
              value={platform}
              onChange={setPlatform}
              options={[
                { value: 'all', label: '全部' },
                { value: 'polymarket', label: 'Polymarket' },
                { value: 'kalshi', label: 'Kalshi' },
                { value: 'predict', label: 'Predict.fun' },
              ]}
            />
          </div>
          <div>
            <Typography.Text strong>状态</Typography.Text>
            <Select<StatusFilter>
              style={{ width: 140, display: 'block', marginTop: 8 }}
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v)
              }}
              options={[
                { value: 'all', label: '全部' },
                { value: 'new', label: 'new' },
                { value: 'executing', label: 'executing' },
                { value: 'filled', label: 'filled' },
              ]}
            />
          </div>
          <Button onClick={() => loadOpps()} loading={loading}>
            刷新
          </Button>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Table<ArbOpportunity>
          rowKey={(r) => r.id ?? `${r.event_key}-${r.created_at}-${r.status}`}
          loading={loading}
          dataSource={filtered}
          columns={columns}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1100 }}
          rowClassName={(record) => {
            const k = record.id ?? `${record.event_key}-${record.created_at}`
            return flashKey === k ? 'pmpe-arb-flash-row' : ''
          }}
        />
      </Card>
    </div>
  )
}
