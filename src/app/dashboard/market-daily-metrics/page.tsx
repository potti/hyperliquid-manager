'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, Empty, Space, Spin, Table, Tag, Tabs, Typography, message } from 'antd'
import { LineChartOutlined, ReloadOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { marketDailyMetricsApi, type MarketDailyMetricItem } from '@/lib/api-client'

const { Text } = Typography

interface DailyPoint {
  date: string
  source: string
  symbol?: string
  value: number
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function getDateLabel(item: MarketDailyMetricItem): string {
  if (typeof item.date === 'string' && item.date) return item.date
  if (typeof item.day === 'string' && item.day) return item.day
  if (typeof item.timestamp === 'number' && Number.isFinite(item.timestamp)) {
    const ms = item.timestamp > 1e12 ? item.timestamp : item.timestamp * 1000
    return new Date(ms).toISOString().slice(0, 10)
  }
  if (typeof item.created_at === 'number' && Number.isFinite(item.created_at)) {
    const ms = item.created_at > 1e12 ? item.created_at : item.created_at * 1000
    return new Date(ms).toISOString().slice(0, 10)
  }
  return '-'
}

function normalizeMetricItems(items: unknown): DailyPoint[] {
  if (!Array.isArray(items)) return []
  return items.reduce<DailyPoint[]>((acc, raw) => {
    const item = (raw || {}) as MarketDailyMetricItem
    const value =
      toNumber(item.value) ??
      toNumber(item.netflow) ??
      toNumber(item.reserve) ??
      toNumber(item.amount) ??
      toNumber(item.funding_rate_pct)
    if (value == null) return acc
    acc.push({
      date: getDateLabel(item),
      source: item.source || item.exchange || item.chain || 'unknown',
      symbol: item.symbol,
      value,
    })
    return acc
  }, [])
}

function buildLineOption(
  points: DailyPoint[],
  yName: string,
  valueFormatter: (value: number) => string
) {
  if (points.length === 0) return null
  const dateSet = new Set(points.map((p) => p.date))
  const dates = Array.from(dateSet).sort()

  const bySource: Record<string, DailyPoint[]> = {}
  points.forEach((point) => {
    if (!bySource[point.source]) bySource[point.source] = []
    bySource[point.source].push(point)
  })

  const series = Object.entries(bySource).map(([source, sourcePoints]) => {
    const valueByDate = new Map(sourcePoints.map((point) => [point.date, point.value]))
    return {
      name: source,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2 },
      data: dates.map((date) => valueByDate.get(date) ?? null),
    }
  })

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!Array.isArray(params)) return ''
        const time = params[0]?.axisValue || ''
        const lines = params.map((p: any) => {
          if (p.value == null) return `${p.marker} ${p.seriesName}: -`
          return `${p.marker} ${p.seriesName}: ${valueFormatter(p.value)}`
        })
        return `${time}<br/>${lines.join('<br/>')}`
      },
    },
    legend: { top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: { rotate: 25 },
    },
    yAxis: {
      type: 'value',
      name: yName,
    },
    series,
  }
}

export default function MarketDailyMetricsPage() {
  const [loading, setLoading] = useState(true)
  const [fundingRates, setFundingRates] = useState<DailyPoint[]>([])
  const [exchangeNetflow, setExchangeNetflow] = useState<DailyPoint[]>([])
  const [stablecoinReserves, setStablecoinReserves] = useState<DailyPoint[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await marketDailyMetricsApi.getDailyMetrics()
      setFundingRates(
        normalizeMetricItems(response.funding_rates || response.fundingRate || response.fundingRates)
      )
      setExchangeNetflow(
        normalizeMetricItems(
          response.exchange_netflow || response.exchangeNetflow || response.netflow || response.net_flow
        )
      )
      setStablecoinReserves(
        normalizeMetricItems(
          response.stablecoin_reserves ||
            response.stablecoinReserves ||
            response.stablecoins ||
            response.reserves
        )
      )
    } catch (e: any) {
      message.error(e?.message || '获取市场日度指标失败')
      setFundingRates([])
      setExchangeNetflow([])
      setStablecoinReserves([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fundingRateOption = useMemo(
    () => buildLineOption(fundingRates, '资金费率(%)', (value) => `${value.toFixed(4)}%`),
    [fundingRates]
  )
  const netflowOption = useMemo(
    () => buildLineOption(exchangeNetflow, '净流量', (value) => value.toLocaleString()),
    [exchangeNetflow]
  )
  const reserveOption = useMemo(
    () => buildLineOption(stablecoinReserves, '储备量', (value) => value.toLocaleString()),
    [stablecoinReserves]
  )

  const tableColumns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 140 },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 160,
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: '币种',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 100,
      render: (value?: string) => value || '-',
    },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      align: 'right' as const,
      render: (value: number) => value.toLocaleString(),
    },
  ]

  const renderMetricBlock = (
    title: string,
    subtitle: string,
    option: any,
    rows: DailyPoint[],
    rowKeyPrefix: string
  ) => (
    <Card
      title={
        <Space>
          <LineChartOutlined />
          {title}
        </Space>
      }
      extra={<Text type="secondary">{subtitle}</Text>}
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spin size="large" tip="加载中..." />
        </div>
      ) : rows.length === 0 ? (
        <Empty description="暂无日度数据" />
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ width: '100%', height: 360 }}>
            <ReactECharts option={option} style={{ width: '100%', height: '100%' }} opts={{ renderer: 'canvas' }} />
          </div>
          <Table
            size="small"
            columns={tableColumns}
            dataSource={rows
              .slice()
              .sort((a, b) => (a.date === b.date ? a.source.localeCompare(b.source) : b.date.localeCompare(a.date)))
              .map((item, index) => ({ ...item, key: `${rowKeyPrefix}-${index}` }))}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 680 }}
          />
        </Space>
      )}
    </Card>
  )

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card>
        <Space wrap size="middle" align="center">
          <Text strong>Market Daily Metrics</Text>
          <Text type="secondary">包含资金费率、交易所净流量、稳定币储备的日度聚合数据</Text>
          <a onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ReloadOutlined spin={loading} />
            刷新
          </a>
        </Space>
      </Card>

      <Tabs
        items={[
          {
            key: 'funding-rates',
            label: '资金费率（日聚合）',
            children: renderMetricBlock(
              '资金费率（多来源日聚合）',
              '数据来自 /api/v1/market/daily-metrics',
              fundingRateOption,
              fundingRates,
              'funding'
            ),
          },
          {
            key: 'exchange-netflow',
            label: '交易所净流量',
            children: renderMetricBlock(
              '交易所净流量（日聚合）',
              '数据来自 /api/v1/market/daily-metrics',
              netflowOption,
              exchangeNetflow,
              'netflow'
            ),
          },
          {
            key: 'stablecoin-reserves',
            label: '稳定币储备',
            children: renderMetricBlock(
              '稳定币储备（日聚合）',
              '数据来自 /api/v1/market/daily-metrics',
              reserveOption,
              stablecoinReserves,
              'reserves'
            ),
          },
        ]}
      />
    </Space>
  )
}
