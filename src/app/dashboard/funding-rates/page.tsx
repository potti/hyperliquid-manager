'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, Select, Space, Spin, message, Empty } from 'antd'
import { ReloadOutlined, LineChartOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { fundingRateApi, type FundingRateItem } from '@/lib/api-client'

const SYMBOLS = ['BTC', 'ETH', 'SOL'] as const
const SOURCE_COLORS: Record<string, string> = {
  hyperliquid: '#177ddc',
  binance: '#52c41a',
}

export default function FundingRatesPage() {
  const [loading, setLoading] = useState(true)
  const [symbol, setSymbol] = useState<string>(SYMBOLS[0])
  const [data, setData] = useState<FundingRateItem[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fundingRateApi.getLast24h()
      setData(res.list || [])
    } catch (e: any) {
      message.error(e?.message || '获取资金费率失败')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 按选中币种筛选，并按 source 分组构建折线图数据
  const chartOption = useMemo(() => {
    const filtered = data.filter((d) => d.symbol === symbol)
    if (filtered.length === 0) return null

    // 按 created_at 排序，去重时间点
    const timeSet = new Set<number>()
    filtered.forEach((d) => timeSet.add(d.created_at))
    const times = Array.from(timeSet).sort((a, b) => a - b)

    const xAxisData = times.map((t) => {
      const d = new Date(t * 1000)
      return d.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    })

    // 按 source 分组
    const bySource: Record<string, FundingRateItem[]> = {}
    filtered.forEach((d) => {
      if (!bySource[d.source]) bySource[d.source] = []
      bySource[d.source].push(d)
    })

    // 构建 series：每个 source 一条线
    const series = Object.entries(bySource).map(([source, items]) => {
      const itemByTime = new Map(items.map((i) => [i.created_at, i]))
      const values = times.map((t) => {
        const item = itemByTime.get(t)
        return item ? item.funding_rate_pct : null
      })
      return {
        name: source === 'hyperliquid' ? 'Hyperliquid' : source.charAt(0).toUpperCase() + source.slice(1),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: values,
        lineStyle: { width: 2 },
        color: SOURCE_COLORS[source] || '#722ed1',
      }
    })

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (!Array.isArray(params)) return ''
          const time = params[0]?.axisValue || ''
          const lines = params.map(
            (p: any) => `${p.marker} ${p.seriesName}: ${p.value != null ? p.value.toFixed(4) + '%' : '-'}`
          )
          return `${time}<br/>${lines.join('<br/>')}`
        },
      },
      legend: {
        data: series.map((s) => s.name),
        top: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
        axisLabel: { rotate: 30 },
      },
      yAxis: {
        type: 'value',
        name: '资金费率 (%)',
        axisLabel: {
          formatter: '{value}%',
        },
      },
      series,
    }
  }, [data, symbol])

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card>
        <Space wrap size="middle" align="center">
          <span>币种：</span>
          <Select
            value={symbol}
            onChange={setSymbol}
            options={SYMBOLS.map((s) => ({ label: s, value: s }))}
            style={{ width: 120 }}
          />
          <span style={{ color: '#999' }}>数据源：Hyperliquid、Binance（最近 24 小时）</span>
          <a onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ReloadOutlined spin={loading} />
            刷新
          </a>
        </Space>
      </Card>

      <Card
        title={
          <Space>
            <LineChartOutlined />
            多数据源资金费率走势
          </Space>
        }
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Spin size="large" tip="加载中..." />
          </div>
        ) : !chartOption ? (
          <Empty description="暂无数据，请稍后重试或等待定时任务采集" />
        ) : (
          <div style={{ width: '100%', height: 400 }}>
            <ReactECharts
              option={chartOption}
              style={{ width: '100%', height: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        )}
      </Card>
    </Space>
  )
}
