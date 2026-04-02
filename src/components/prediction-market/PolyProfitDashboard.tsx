'use client'

import { useEffect, useMemo, useState } from 'react'
import { Row, Col, Typography, Table, Tag, message, Space, Badge } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { pmpeApi } from '@/services/pmpe/api'
import type {
  ArbOpportunity,
  ProfitHistoryPoint,
  ProfitStats,
  SmartWallet,
} from '@/services/pmpe/types'
import ProfitCard from '@/components/prediction-market/ProfitCard'
import ProfitHistoryChart from '@/components/prediction-market/charts/ProfitHistoryChart'
import StrategyMixPie from '@/components/prediction-market/charts/StrategyMixPie'
import { usePMPEWebSocket } from '@/components/prediction-market/hooks/usePMPEWebSocket'

function last7DaysPlaceholder(): ProfitHistoryPoint[] {
  const out: ProfitHistoryPoint[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    out.push({
      date: d.toISOString().slice(0, 10),
      pnl: 0,
    })
  }
  return out
}

function mergeHistory(
  apiData: ProfitHistoryPoint[]
): ProfitHistoryPoint[] {
  if (apiData.length > 0) return apiData
  return last7DaysPlaceholder()
}

export default function PolyProfitDashboard() {
  const [stats, setStats] = useState<ProfitStats | null>(null)
  const [history, setHistory] = useState<ProfitHistoryPoint[]>([])
  const [wallets, setWallets] = useState<SmartWallet[]>([])
  const [opps, setOpps] = useState<ArbOpportunity[]>([])
  const [loading, setLoading] = useState(true)

  const { connected, lastProfitUpdate, lastNewOpportunity } =
    usePMPEWebSocket(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [st, hist, swRes, aoRes] = await Promise.all([
          pmpeApi.getProfitStats().catch(() => null),
          pmpeApi.getProfitHistory(),
          pmpeApi
            .listSmartWallets({ eligible: true, limit: 3 })
            .catch(() => ({ count: 0, wallets: [] as SmartWallet[] })),
          pmpeApi
            .listArbOpportunities({ status: 'new', limit: 3 })
            .catch(() => ({ count: 0, opportunities: [] as ArbOpportunity[] })),
        ])
        if (cancelled) return
        setStats(st)
        setHistory(mergeHistory(hist))
        setWallets(swRes.wallets ?? [])
        setOpps(aoRes.opportunities ?? [])
      } catch {
        message.warning('PMPE 接口暂不可用，已使用本地占位数据')
        setHistory(last7DaysPlaceholder())
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const todayPnL = lastProfitUpdate?.today_pnl ?? 0
  const cumulative =
    lastProfitUpdate?.cumulative_pnl ?? stats?.total_pnl ?? 0
  const winRate = lastProfitUpdate?.win_rate ?? stats?.win_rate ?? 0
  const arbCount =
    lastProfitUpdate?.arb_count_24h ?? Math.min(stats?.trade_count ?? 0, 99)

  const pieMix = useMemo(() => {
    const tc = Number(stats?.trade_count ?? 0)
    if (tc <= 0) {
      return { copy: 33, arb: 33, info: 34 }
    }
    return {
      copy: Math.max(1, Math.round(tc * 0.65)),
      arb: Math.max(1, Math.round(tc * 0.28)),
      info: Math.max(1, Math.round(tc * 0.07)),
    }
  }, [stats?.trade_count])

  const walletColumns: ColumnsType<SmartWallet> = [
    { title: '钱包', dataIndex: 'wallet', ellipsis: true },
    {
      title: '7d PnL%',
      dataIndex: 'pnl_pct',
      render: (v: number) => `${v?.toFixed?.(2) ?? v}%`,
    },
    {
      title: '胜率',
      dataIndex: 'win_rate',
      render: (v: number) => `${v?.toFixed?.(1) ?? v}%`,
    },
    {
      title: '最近活跃',
      dataIndex: 'last_seen_ts',
      render: (ts: number) =>
        ts ? new Date(ts * 1000).toLocaleString() : '—',
    },
  ]

  const oppColumns: ColumnsType<ArbOpportunity> = [
    { title: '事件', dataIndex: 'event_key', ellipsis: true },
    {
      title: '净价差',
      dataIndex: 'net_spread',
      render: (v: number) => (v != null ? `${(v * 100).toFixed(2)}%` : '—'),
    },
    { title: '方向', dataIndex: 'direction', ellipsis: true },
    { title: '状态', dataIndex: 'status', render: (s) => <Tag>{s}</Tag> },
  ]

  const highlightKey = lastNewOpportunity?.opportunity?.event_key

  return (
    <div>
      <Space align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          PolyProfit - 概览仪表盘
        </Typography.Title>
        <Badge
          status={connected ? 'success' : 'default'}
          text={connected ? '实时通道(模拟)' : '连接中…'}
        />
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <ProfitCard
            title="今日利润"
            value={todayPnL}
            precision={2}
            trend={todayPnL >= 0 ? 'up' : 'down'}
            loading={loading}
            prefix="$"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <ProfitCard
            title="累计收益"
            value={cumulative}
            precision={2}
            trend={cumulative >= 0 ? 'up' : 'down'}
            loading={loading}
            prefix="$"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <ProfitCard
            title="跟单胜率"
            value={(winRate * 100).toFixed(1)}
            suffix="%"
            subtitle="来自 PMPE stats / 模拟推送"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <ProfitCard
            title="套利次数(24h)"
            value={arbCount}
            precision={0}
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
            <ProfitHistoryChart data={history} />
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
            <StrategyMixPie
              copy={pieMix.copy}
              arb={pieMix.arb}
              info={pieMix.info}
            />
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Typography.Title level={5}>Top 聪明钱（榜单）</Typography.Title>
          <Table<SmartWallet>
            size="small"
            rowKey={(r) => `${r.source}-${r.wallet}`}
            loading={loading}
            dataSource={wallets}
            columns={walletColumns}
            pagination={false}
          />
        </Col>
        <Col xs={24} lg={12}>
          <Typography.Title level={5}>Top 套利机会</Typography.Title>
          <Table<ArbOpportunity>
            size="small"
            rowKey={(r) => r.id ?? `${r.event_key}-${r.created_at}`}
            loading={loading}
            dataSource={opps}
            columns={oppColumns}
            pagination={false}
            onRow={(record) => ({
              style:
                highlightKey && record.event_key === highlightKey
                  ? { background: '#fffbe6' }
                  : undefined,
            })}
          />
        </Col>
      </Row>
    </div>
  )
}
