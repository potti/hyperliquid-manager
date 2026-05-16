'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, Row, Col, Typography, Spin, Tag, Table, Empty, Tooltip } from 'antd'
import {
  RiseOutlined,
  FallOutlined,
  ThunderboltOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { strategyApi } from '@/services/strategy/api'

const { Title, Text } = Typography

interface PredictionData {
  timeframe: string
  direction: string
  confidence: number
  generated_at: number
}

interface WhaleActivity {
  symbol: string
  buy_volume: number
  sell_volume: number
  net_flow: number
  trade_count: number
  unique_addresses: number
  avg_trade_size: number
}

interface FundingRateEntry {
  source: string
  rate_pct: number
  bias: string
  updated_at: number
}

interface PositionEntry {
  platform: string
  market_id: number
  market_title: string
  side: string
  size: number
  entry_price: number
  status: string
  created_at: string
}

interface CapitalEntry {
  total_allocated: number
  available: number
  used: number
  daily_pnl: number
}

interface DashboardData {
  account: { name: string; strategy: string; status: string; last_tick_at: string }
  predictions: PredictionData[]
  whale_activity: WhaleActivity | null
  funding_rates: FundingRateEntry[]
  positions: PositionEntry[]
  capital: CapitalEntry
  updated_at: number
}

interface BtcMarketEvent {
  id: number
  title: string
  question: string
  yes_price: number
  no_price: number
  liquidity: number
  volume: number
  status: string
  end_date: string
  category_slug: string
  outcomes: Array<{
    name: string
    best_bid: number
    best_ask: number
    bid_size: number
    ask_size: number
  }>
}

export default function BtcShorttermPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [btcMarkets, setBtcMarkets] = useState<BtcMarketEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [marketsLoading, setMarketsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      const accounts = await strategyApi.listAccounts()
      const btcAccount = accounts.find(
        (a) => a.strategy === 'btc_shortterm' && a.status === 'running'
      )
      if (!btcAccount) {
        if (!data) {
          setError('No running BTC shortterm strategy account found')
        }
        return
      }
      const result = await strategyApi.getAccountDashboard(btcAccount.name)
      setData(result)
      setLastRefresh(new Date())
      setError(null)
    } catch (err: any) {
      if (!data) {
        setError(err.message || 'Failed to load dashboard data')
      }
    } finally {
      setLoading(false)
    }
  }, [data])

  const fetchBtcMarkets = useCallback(async () => {
    setMarketsLoading(true)
    try {
      const accounts = await strategyApi.listAccounts()
      const btcAccount = accounts.find(
        (a) => a.strategy === 'btc_shortterm' && a.status === 'running'
      )
      if (!btcAccount) return
      const markets = await strategyApi.getBtcMarkets(btcAccount.name)
      setBtcMarkets(markets || [])
    } catch {
      // markets API may not be available yet
    } finally {
      setMarketsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    fetchBtcMarkets()
    const interval = setInterval(() => {
      fetchDashboard()
      fetchBtcMarkets()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboard, fetchBtcMarkets])

  const getDirectionTag = (direction: string) => {
    if (direction === 'YES') {
      return <Tag color="green" icon={<RiseOutlined />}>YES ↑</Tag>
    }
    return <Tag color="red" icon={<FallOutlined />}>NO ↓</Tag>
  }

  const getBiasTag = (bias: string) => {
    switch (bias) {
      case 'bullish': return <Tag color="green">Bullish</Tag>
      case 'bearish': return <Tag color="red">Bearish</Tag>
      default: return <Tag>Neutral</Tag>
    }
  }

  const fundingColumns = [
    { title: 'Source', dataIndex: 'source', key: 'source' },
    {
      title: 'Rate',
      dataIndex: 'rate_pct',
      key: 'rate_pct',
      render: (v: number) => `${v.toFixed(4)}%`,
    },
    {
      title: 'Bias',
      dataIndex: 'bias',
      key: 'bias',
      render: (bias: string) => getBiasTag(bias),
    },
  ]

  const positionColumns = [
    { title: 'Market', dataIndex: 'market_title', key: 'market_title', ellipsis: true },
    { title: 'Side', dataIndex: 'side', key: 'side' },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (v: number) => v.toFixed(2),
    },
    {
      title: 'Entry',
      dataIndex: 'entry_price',
      key: 'entry_price',
      render: (v: number) => `$${v.toFixed(4)}`,
    },
    { title: 'Status', dataIndex: 'status', key: 'status' },
  ]

  const marketEventColumns = [
    {
      title: 'Market',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: BtcMarketEvent) => (
        <Tooltip title={record.question || title}>
          <Text style={{ fontSize: 13 }}>{title}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'YES %',
      key: 'yes_pct',
      width: 100,
      render: (_: any, record: BtcMarketEvent) => {
        const pct = (record.yes_price * 100).toFixed(1)
        return <Text style={{ color: '#52c41a', fontWeight: 500 }}>{pct}%</Text>
      },
    },
    {
      title: 'NO %',
      key: 'no_pct',
      width: 100,
      render: (_: any, record: BtcMarketEvent) => {
        const pct = (record.no_price * 100).toFixed(1)
        return <Text style={{ color: '#ff4d4f', fontWeight: 500 }}>{pct}%</Text>
      },
    },
    {
      title: 'Liquidity',
      dataIndex: 'liquidity',
      key: 'liquidity',
      width: 120,
      render: (v: number) => `$${v.toFixed(0)}`,
    },
  ]

  const expandedMarketRow = (record: BtcMarketEvent) => {
    const outcomeColumns = [
      { title: 'Option', dataIndex: 'name', key: 'name' },
      {
        title: 'Bid',
        key: 'bid',
        render: (_: any, o: BtcMarketEvent['outcomes'][0]) =>
          o.best_bid > 0 ? `$${o.best_bid.toFixed(4)} × ${o.bid_size.toFixed(2)}` : '—',
      },
      {
        title: 'Ask',
        key: 'ask',
        render: (_: any, o: BtcMarketEvent['outcomes'][0]) =>
          o.best_ask > 0 ? `$${o.best_ask.toFixed(4)} × ${o.ask_size.toFixed(2)}` : '—',
      },
    ]
    return (
      <Table
        dataSource={record.outcomes}
        columns={outcomeColumns}
        pagination={false}
        size="small"
        rowKey="name"
        style={{ margin: '4px 0' }}
      />
    )
  }

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          <ThunderboltOutlined /> BTC 短期策略
        </Title>
        <Text type="secondary">
          Last refresh: {lastRefresh?.toLocaleTimeString() || '—'}
          {loading && <Spin size="small" style={{ marginLeft: 8 }} />}
        </Text>
      </div>

      {error && (
        <Card style={{ marginBottom: 16 }}>
          <Text type="warning">{error}</Text>
        </Card>
      )}

      {/* Row 1: K-line (left) + Predict.fun BTC Markets (right) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="BTC/USDT 实时K线" size="small" style={{ height: '100%' }}>
            <TradingViewWidget />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="BTC 短期预测市场事件"
            size="small"
            extra={marketsLoading ? <Spin size="small" /> : <Text type="secondary">{btcMarkets.length} markets</Text>}
            style={{ height: '100%' }}
          >
            {btcMarkets.length > 0 ? (
              <Table
                dataSource={btcMarkets}
                columns={marketEventColumns}
                pagination={false}
                size="small"
                rowKey="id"
                scroll={{ y: 340 }}
                expandable={{
                  expandedRowRender: expandedMarketRow,
                  rowExpandable: (r) => r.outcomes && r.outcomes.length > 0,
                }}
              />
            ) : (
              <Empty
                description={marketsLoading ? 'Loading markets...' : 'No BTC markets found'}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Row 2: Direction Predictions, Whale Indicators, Funding Rates */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* Direction Predictions */}
        <Col xs={24} lg={8}>
          <Card title="方向预测" size="small">
            {data?.predictions && data.predictions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.predictions.map((p) => (
                  <div key={p.timeframe} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: '#fafafa', borderRadius: 6,
                  }}>
                    <Text strong>{p.timeframe}</Text>
                    {getDirectionTag(p.direction)}
                    <Text>{(p.confidence * 100).toFixed(0)}%</Text>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="Waiting for signal data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        {/* Whale Indicators */}
        <Col xs={24} lg={8}>
          <Card title="巨鲸指标 (60min)" size="small">
            {data?.whale_activity ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Row justify="space-between">
                  <Text type="secondary">加仓巨鲸</Text>
                  <Text strong>{data.whale_activity.unique_addresses} 地址</Text>
                </Row>
                <Row justify="space-between">
                  <Text type="secondary">净流向</Text>
                  <Text strong style={{ color: data.whale_activity.net_flow >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    {data.whale_activity.net_flow >= 0 ? '+' : ''}{data.whale_activity.net_flow.toFixed(2)} BTC
                  </Text>
                </Row>
                <Row justify="space-between">
                  <Text type="secondary">交易笔数</Text>
                  <Text strong>{data.whale_activity.trade_count}</Text>
                </Row>
                <Row justify="space-between">
                  <Text type="secondary">买入量</Text>
                  <Text>{data.whale_activity.buy_volume.toFixed(2)} BTC</Text>
                </Row>
                <Row justify="space-between">
                  <Text type="secondary">卖出量</Text>
                  <Text>{data.whale_activity.sell_volume.toFixed(2)} BTC</Text>
                </Row>
              </div>
            ) : (
              <Empty description="Waiting for whale data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        {/* Funding Rates */}
        <Col xs={24} lg={8}>
          <Card title="资金费率 (多源)" size="small">
            {data?.funding_rates && data.funding_rates.length > 0 ? (
              <Table
                dataSource={data.funding_rates}
                columns={fundingColumns}
                pagination={false}
                size="small"
                rowKey="source"
              />
            ) : (
              <Empty description="Waiting for funding data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Row 3: Positions */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={<><WalletOutlined /> 当前持仓 (Predict.fun)</>}
            size="small"
          >
            {data?.positions && data.positions.length > 0 ? (
              <Table
                dataSource={data.positions}
                columns={positionColumns}
                pagination={false}
                size="small"
                rowKey={(r: PositionEntry) => `${r.market_id}-${r.side}`}
              />
            ) : (
              <Empty description="No open positions" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

// TradingView Advanced Real-Time Chart Widget
function TradingViewWidget() {
  useEffect(() => {
    const existingContainer = document.getElementById('tv-chart-container')
    if (existingContainer?.querySelector('iframe')) return

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => {
      if ((window as any).TradingView) {
        new (window as any).TradingView.widget({
          container_id: 'tv-chart-container',
          symbol: 'BITSTAMP:BTCUSD',
          interval: '5',
          timezone: 'Asia/Shanghai',
          theme: 'light',
          style: '1',
          locale: 'zh_CN',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          details: true,
          hotlist: true,
          calendar: false,
          height: 420,
        })
      }
    }
    document.head.appendChild(script)
    return () => {
      const el = document.getElementById('tv-chart-container')
      if (el) el.innerHTML = ''
    }
  }, [])

  return <div id="tv-chart-container" style={{ height: 420 }} />
}
