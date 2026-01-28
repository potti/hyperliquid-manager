'use client'

import { useState, useEffect, useCallback } from 'react'
import { Descriptions, Table, Tag, Space, Alert, Typography, Card, Tabs, message, Spin, Button } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { copyTradingApi, apiClient, marketKlineApi } from '@/lib/api-client'
import ReactECharts from 'echarts-for-react'
import type { TraderInfo } from '@/components/copy-trading/TraderInfoModal'

const { Title, Text } = Typography

// 交易员仓位类型
interface TraderPosition {
  coin: string
  side: string
  leverage: string
  size: string
  position_value: string
  entry_price: string
  mark_price: string
  liquidation_px: string
  unrealized_pnl: string
  margin_used: string
  return_on_equity: string
}

// 仓位汇总类型
interface PositionSummary {
  total_position_value: string
  position_count: number
  long_position_count: number
  short_position_count: number
  total_unrealized_pnl: string
}

// 历史仓位类型
interface HistoricalPosition {
  id: string
  account_id: string
  address: string
  symbol: string
  side: string
  size: number
  position_value: number
  entry_price: number
  last_entry_price: number
  mark_price: number
  liquidation_px: number
  unrealized_pnl: number
  margin_used: number
  return_on_equity: number
  leverage: number
  status: string
  close_price?: number
  realized_pnl?: number
  realized_pnl_pct?: number
  created_at: number
  updated_at: number
}

interface TraderInfoContentProps {
  address: string
}

export default function TraderInfoContent({ address }: TraderInfoContentProps) {
  const [loading, setLoading] = useState(true)
  const [traderInfo, setTraderInfo] = useState<TraderInfo | null>(null)
  const [activeTab, setActiveTab] = useState('current')
  const [historicalPositions, setHistoricalPositions] = useState<HistoricalPosition[]>([])
  const [historicalLoading, setHistoricalLoading] = useState(false)
  const [historicalPagination, setHistoricalPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  })
  const [klineData, setKlineData] = useState<Array<{
    open_time: number
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>>([])
  const [klineLoading, setKlineLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // 获取交易员信息
  const fetchTraderInfo = useCallback(async () => {
    if (!address) return

    setLoading(true)
    try {
      const response = await apiClient<TraderInfo>(
        `/api/v1/copy-trading/traders?address=${encodeURIComponent(address)}`
      )
      setTraderInfo(response)
    } catch (error: any) {
      message.error(`获取交易员信息失败: ${error.message}`)
      setTraderInfo(null)
    } finally {
      setLoading(false)
    }
  }, [address])

  // 获取历史仓位数据
  const fetchHistoricalPositions = useCallback(async (page = 1, pageSize = 20, forKline = false) => {
    if (!address) return

    setHistoricalLoading(true)
    try {
      const response = await copyTradingApi.getHistoricalFills({
        address,
        page,
        pageSize: forKline ? Math.max(pageSize, 100) : pageSize, // K线图需要更多数据
      })
      const positions = response.positions || []
      
      if (forKline) {
        // 如果是为K线图获取数据，只保留BTC相关的交易
        const btcPositions = positions.filter((p: any) => {
          const symbol = p.symbol?.toUpperCase() || ''
          return symbol === 'BTC' || symbol === 'BTCUSDT' || symbol.includes('BTC')
        })
        // 合并到现有历史仓位中（去重）
        setHistoricalPositions((prev) => {
          const existingKeys = new Set(prev.map((p: any) => p.id))
          const newPositions = btcPositions.filter((p: any) => !existingKeys.has(p.id))
          return [...prev, ...newPositions]
        })
      } else {
        setHistoricalPositions(positions)
        setHistoricalPagination(response.pagination || { page, pageSize, total: 0 })
      }
    } catch (error: any) {
      message.error(`获取历史仓位失败: ${error.message}`)
      if (!forKline) {
        setHistoricalPositions([])
      }
    } finally {
      setHistoricalLoading(false)
    }
  }, [address])

  // 组件挂载时获取交易员信息
  useEffect(() => {
    fetchTraderInfo()
  }, [fetchTraderInfo])

  // 刷新交易员数据（包括历史数据）
  const handleRefresh = useCallback(async () => {
    if (!address || refreshing) return

    setRefreshing(true)
    try {
      // 调用刷新历史数据接口，该接口会返回最新的交易员信息
      const response = await copyTradingApi.refreshHistory(address)
      
      // 直接更新页面数据
      setTraderInfo(response)
      message.success('数据已刷新')
    } catch (error: any) {
      message.error(`刷新失败: ${error.message}`)
    } finally {
      setRefreshing(false)
    }
  }, [address, refreshing])

  // 获取K线数据
  const fetchKlineData = useCallback(async () => {
    if (!address) return

    setKlineLoading(true)
    try {
      // 计算时间范围：最近7天
      const endTime = Math.floor(Date.now() / 1000) // 当前时间（Unix秒）
      const startTime = endTime - 7 * 24 * 60 * 60 // 7天前

      const response = await marketKlineApi.getKlines({
        symbol: 'BTC', // 默认使用BTC，后续可以根据交易员实际交易的币种调整
        interval: '1h',
        start_time: startTime,
        end_time: endTime,
      })
      setKlineData(response.klines || [])
    } catch (error: any) {
      console.error('获取K线数据失败:', error)
      // 如果获取失败，使用模拟数据
      setKlineData([])
    } finally {
      setKlineLoading(false)
    }
  }, [address])

  // 当切换到历史仓位 tab 或 K线图 tab 时，加载数据
  useEffect(() => {
    if (activeTab === 'historical' && address) {
      fetchHistoricalPositions(1, 20, false)
    } else if (activeTab === 'kline' && address) {
      // 获取历史仓位用于标记（需要获取更多数据以确保包含所有BTC交易）
      fetchHistoricalPositions(1, 100, true) // 获取前100条记录，仅保留BTC交易
      fetchKlineData() // 获取K线数据
    }
  }, [activeTab, address, fetchHistoricalPositions, fetchKlineData])

  // 处理历史仓位表格分页变化
  const handleHistoricalTableChange = (page: number, pageSize: number) => {
    setHistoricalPagination(prev => ({ ...prev, page, pageSize }))
    fetchHistoricalPositions(page, pageSize, false)
  }

  // 生成 K 线图配置（使用真实数据或模拟数据）
  const getKlineOption = () => {
    const dates: string[] = []
    const klineChartData: number[][] = []
    const volumes: number[] = []
    const dateTimestamps: number[] = [] // 存储时间戳，用于匹配交易信号
    
    // 如果有真实K线数据，使用真实数据；否则使用模拟数据
    if (klineData.length > 0) {
      // 使用真实K线数据
      klineData.forEach((kline) => {
        const date = new Date(kline.open_time * 1000)
        const timestamp = date.getTime()
        
        // 格式化时间显示：MM-DD HH:00
        const dateLabel = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + 
                         ' ' + 
                         date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        
        dates.push(dateLabel)
        dateTimestamps.push(timestamp)
        
        // OHLC 数据格式：[open, close, low, high]
        klineChartData.push([kline.open, kline.close, kline.low, kline.high])
        volumes.push(kline.volume || 0)
      })
    } else {
      // 使用模拟数据（7 天，每小时一根 K 线，共 168 根）
      const now = Date.now()
      const basePrice = 50000 // 基础价格（模拟 BTC 价格）
      const hoursToShow = 168 // 显示 7 天的数据（7 * 24 = 168 小时）
      
      for (let i = hoursToShow - 1; i >= 0; i--) {
        const date = new Date(now - i * 60 * 60 * 1000) // 每小时
        const timestamp = date.getTime()
        
        // 格式化时间显示：每小时显示 MM-DD HH:00
        const dateLabel = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + 
                         ' ' + 
                         date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        
        dates.push(dateLabel)
        dateTimestamps.push(timestamp)
        
        // 生成模拟的 OHLC 数据（每小时的价格波动）
        const open = basePrice + (Math.random() - 0.5) * 200
        const close = open + (Math.random() - 0.5) * 300
        const high = Math.max(open, close) + Math.random() * 100
        const low = Math.min(open, close) - Math.random() * 100
        const volume = Math.random() * 100 + 50
        
        klineChartData.push([open, close, low, high])
        volumes.push(volume)
      }
    }

    // 计算K线数据的最高价和最低价，用于标记位置
    let maxPrice = 0
    let minPrice = Infinity
    klineChartData.forEach((kline) => {
      const [, , low, high] = kline
      if (high > maxPrice) maxPrice = high
      if (low < minPrice) minPrice = low
    })
    // 如果使用模拟数据，设置默认值
    if (maxPrice === 0) {
      maxPrice = 52000
      minPrice = 48000
    }

    // 从历史仓位数据中提取买入和卖出标记（仅显示BTC交易）
    // 使用 markLine 在对应时间点画垂直线，并在顶部显示标签
    const buyMarkLines: any[] = [] // 买入标记（开仓）
    const sellMarkLines: any[] = [] // 卖出标记（平仓）

    // 过滤出BTC相关的交易记录
    const btcPositions = historicalPositions.filter((position) => {
      // 检查币种是否为BTC（不区分大小写）
      const symbol = position.symbol?.toUpperCase() || ''
      return symbol === 'BTC' || symbol === 'BTCUSDT' || symbol.includes('BTC')
    })

    btcPositions.forEach((position) => {
      // 买入标记（开仓）
      if (position.created_at) {
        const entryTimestamp = position.created_at * 1000
        // 找到最接近的K线时间点
        let closestIndex = 0
        let minDiff = Math.abs(dateTimestamps[0] - entryTimestamp)
        for (let i = 1; i < dateTimestamps.length; i++) {
          const diff = Math.abs(dateTimestamps[i] - entryTimestamp)
          if (diff < minDiff) {
            minDiff = diff
            closestIndex = i
          }
        }
        
        // 如果时间差在合理范围内（比如7天内），添加标记
        if (minDiff < 7 * 24 * 60 * 60 * 1000) {
          const side = position.side === 'Long' ? '做多' : '做空'
          const markerColor = position.side === 'Long' ? '#52c41a' : '#ff4d4f'
          buyMarkLines.push({
            name: `${side}开仓`,
            xAxis: closestIndex, // 在对应的时间点画垂直线
            lineStyle: {
              color: markerColor,
              width: 2,
              type: 'dashed', // 虚线
            },
            label: {
              show: true,
              position: 'start', // 标签显示在线的起点（顶部）
              formatter: `${side}开仓\n$${position.entry_price.toFixed(2)}`,
              color: markerColor,
              fontSize: 11,
              fontWeight: 'bold',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: [4, 6],
              borderRadius: 4,
              borderColor: markerColor,
              borderWidth: 1,
            },
            symbol: ['none', 'none'], // 不显示端点符号
          })
        }
      }

      // 卖出标记（平仓）
      if (position.close_price && position.updated_at && position.status !== 'OPEN') {
        const closeTimestamp = position.updated_at * 1000
        // 找到最接近的K线时间点
        let closestIndex = 0
        let minDiff = Math.abs(dateTimestamps[0] - closeTimestamp)
        for (let i = 1; i < dateTimestamps.length; i++) {
          const diff = Math.abs(dateTimestamps[i] - closeTimestamp)
          if (diff < minDiff) {
            minDiff = diff
            closestIndex = i
          }
        }
        
        // 如果时间差在合理范围内（比如7天内），添加标记
        if (minDiff < 7 * 24 * 60 * 60 * 1000) {
          // 平仓标记颜色：根据原仓位方向决定（做多用绿色，做空用红色）
          const sideColor = position.side === 'Long' ? '#52c41a' : '#ff4d4f'
          sellMarkLines.push({
            name: '平仓',
            xAxis: closestIndex, // 在对应的时间点画垂直线
            lineStyle: {
              color: sideColor,
              width: 2,
              type: 'dashed', // 虚线
            },
            label: {
              show: true,
              position: 'start', // 标签显示在线的起点（顶部）
              formatter: `平仓\n$${position.close_price.toFixed(2)}`,
              color: sideColor,
              fontSize: 11,
              fontWeight: 'bold',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: [4, 6],
              borderRadius: 4,
              borderColor: sideColor,
              borderWidth: 1,
            },
            symbol: ['none', 'none'], // 不显示端点符号
          })
        }
      }
    })

    // 调试：检查是否有标记数据
    console.log('K线标记数据:', {
      btcPositionsCount: btcPositions.length,
      buyMarkLinesCount: buyMarkLines.length,
      sellMarkLinesCount: sellMarkLines.length,
      maxPrice,
      minPrice,
    })

    return {
      title: {
        text: 'BTC/USDT K线图 (1小时)',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: (params: any) => {
          if (!params || !Array.isArray(params)) return ''
          
          const klineData = params.find((p: any) => 
            p.seriesName === 'K线' || p.seriesType === 'candlestick'
          )
          
          if (!klineData || !klineData.value) return ''
          
          const value = klineData.value
          if (!Array.isArray(value) || value.length < 4) return ''
          
          const [open, close, low, high] = value.map(Number)
          const change = close - open
          const changePercent = ((change / open) * 100).toFixed(2)
          const color = change >= 0 ? '#ef5350' : '#26a69a'
          
          const volumeData = params.find((p: any) => 
            p.seriesName === '成交量' || p.seriesType === 'bar'
          )
          const volume = volumeData && volumeData.value ? Number(volumeData.value).toFixed(2) : '--'
          
          return `
            <div style="padding: 8px;">
              <div><strong>${klineData.name || ''}</strong></div>
              <div>开盘: <span style="color: #333;">$${open.toFixed(2)}</span></div>
              <div>收盘: <span style="color: ${color};">$${close.toFixed(2)}</span></div>
              <div>最高: <span style="color: #333;">$${high.toFixed(2)}</span></div>
              <div>最低: <span style="color: #333;">$${low.toFixed(2)}</span></div>
              <div>涨跌: <span style="color: ${color};">${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent}%)</span></div>
              <div>成交量: <span style="color: #333;">${volume}</span></div>
            </div>
          `
        },
      },
      grid: [
        {
          left: '10%',
          right: '8%',
          top: '20%', // 增加顶部空间，为标记留出位置
          height: '45%',
        },
        {
          left: '10%',
          right: '8%',
          top: '70%',
          height: '15%',
        },
      ],
      xAxis: [
        {
          type: 'category',
          data: dates,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          splitNumber: 20,
          min: 'dataMin',
          max: 'dataMax',
          axisLabel: {
            show: true,
            interval: 'auto', // 自动间隔，避免标签重叠
            rotate: 45, // 旋转45度
            formatter: (value: string, index: number) => {
              // 只显示整点时间，减少标签数量
              if (value.includes(':00') || index % 6 === 0) {
                return value
              }
              return ''
            },
            fontSize: 10,
          },
        },
        {
          type: 'category',
          gridIndex: 1,
          data: dates,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          min: 'dataMin',
          max: 'dataMax',
        },
      ],
      yAxis: [
        {
          scale: true,
          splitArea: {
            show: true,
          },
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 70, // 默认显示最近30%的数据（约50小时）
          end: 100,
        },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: 'slider',
          top: '90%',
          start: 70,
          end: 100,
        },
      ],
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: klineChartData,
          itemStyle: {
            color: '#ef5350',
            color0: '#26a69a',
            borderColor: '#ef5350',
            borderColor0: '#26a69a',
          },
          markLine: {
            data: [
              ...buyMarkLines,
              ...sellMarkLines,
            ],
            animation: true,
          },
        },
        {
          name: '成交量',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: volumes,
          itemStyle: {
            color: (params: any) => {
              const [open, close] = klineChartData[params.dataIndex]
              return close >= open ? '#ef5350' : '#26a69a'
            },
          },
        },
      ],
    }
  }

  // 格式化美元金额
  const formatUSD = (value: string | undefined) => {
    if (!value || value === '0' || value === '0.00') {
      return <span style={{ color: '#999' }}>$0.00</span>
    }
    const num = parseFloat(value)
    if (isNaN(num)) {
      return <span style={{ color: '#999' }}>--</span>
    }
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)

    if (num > 0) {
      return <span style={{ color: '#52c41a', fontWeight: 500 }}>{formatted}</span>
    } else if (num < 0) {
      return <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{formatted}</span>
    }
    return <span>{formatted}</span>
  }

  // 格式化百分比
  const formatPercent = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return '--'
    const color = num >= 0 ? '#52c41a' : '#ff4d4f'
    return <span style={{ color, fontWeight: 500 }}>{num >= 0 ? '+' : ''}{num.toFixed(2)}%</span>
  }

  // 格式化地址
  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // 历史仓位列表列配置
  const historicalPositionColumns = [
    {
      title: '币种',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 100,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '方向',
      dataIndex: 'side',
      key: 'side',
      width: 80,
      render: (side: string) => (
        <Tag color={side === 'Long' ? 'green' : 'red'}>
          {side === 'Long' ? '做多' : '做空'}
        </Tag>
      ),
    },
    {
      title: '杠杆',
      dataIndex: 'leverage',
      key: 'leverage',
      width: 80,
      render: (leverage: number) => `${leverage}x`,
    },
    {
      title: '数量',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number) => Math.abs(size).toFixed(4),
    },
    {
      title: '开仓价格',
      dataIndex: 'entry_price',
      key: 'entry_price',
      width: 120,
      render: (price: number) => price ? `$${price.toFixed(2)}` : '--',
    },
    {
      title: '平仓价格',
      dataIndex: 'close_price',
      key: 'close_price',
      width: 120,
      render: (price: number | undefined) => price ? `$${price.toFixed(2)}` : '--',
    },
    {
      title: '已实现盈亏',
      dataIndex: 'realized_pnl',
      key: 'realized_pnl',
      width: 130,
      render: (pnl: number | undefined) => {
        if (pnl === undefined || pnl === null) return '--'
        return formatUSD(pnl.toString())
      },
    },
    {
      title: '已实现盈亏%',
      dataIndex: 'realized_pnl_pct',
      key: 'realized_pnl_pct',
      width: 120,
      render: (pct: number | undefined) => {
        if (pct === undefined || pct === null) return '--'
        return formatPercent(pct.toString())
      },
    },
    {
      title: '开仓时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (timestamp: number) => {
        if (!timestamp) return '--'
        return new Date(timestamp * 1000).toLocaleString('zh-CN')
      },
    },
    {
      title: '平仓时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (timestamp: number, record: HistoricalPosition) => {
        if (!timestamp || record.status === 'OPEN') return '--'
        return new Date(timestamp * 1000).toLocaleString('zh-CN')
      },
    },
  ]

  // 当前仓位列表列配置
  const positionColumns = [
    {
      title: '币种',
      dataIndex: 'coin',
      key: 'coin',
      width: 100,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '方向',
      dataIndex: 'side',
      key: 'side',
      width: 80,
      render: (side: string) => (
        <Tag color={side === 'Long' ? 'green' : 'red'}>
          {side === 'Long' ? '做多' : '做空'}
        </Tag>
      ),
    },
    {
      title: '杠杆',
      dataIndex: 'leverage',
      key: 'leverage',
      width: 80,
      render: (leverage: string) => leverage,
    },
    {
      title: '数量',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: string) => {
        const num = parseFloat(size)
        return Math.abs(num).toFixed(4)
      },
    },
    {
      title: '持仓价值',
      dataIndex: 'position_value',
      key: 'position_value',
      width: 130,
      render: (value: string) => formatUSD(value),
    },
    {
      title: '开仓价格',
      dataIndex: 'entry_price',
      key: 'entry_price',
      width: 120,
      render: (price: string) => formatUSD(price),
    },
    {
      title: '标记价格',
      dataIndex: 'mark_price',
      key: 'mark_price',
      width: 120,
      render: (price: string) => formatUSD(price),
    },
    {
      title: '清算价格',
      dataIndex: 'liquidation_px',
      key: 'liquidation_px',
      width: 120,
      render: (price: string) => formatUSD(price),
    },
    {
      title: '未实现盈亏',
      dataIndex: 'unrealized_pnl',
      key: 'unrealized_pnl',
      width: 130,
      render: (pnl: string) => formatUSD(pnl),
    },
    {
      title: '保证金',
      dataIndex: 'margin_used',
      key: 'margin_used',
      width: 120,
      render: (margin: string) => formatUSD(margin),
    },
    {
      title: 'ROE',
      dataIndex: 'return_on_equity',
      key: 'return_on_equity',
      width: 100,
      render: (roe: string) => formatPercent(roe),
    },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="加载交易员信息中..." />
      </div>
    )
  }

  if (!traderInfo) {
    return (
      <Alert
        message="获取交易员信息失败"
        description="无法获取该地址的交易员信息，请检查地址是否正确。"
        type="error"
        showIcon
      />
    )
  }

  // 生成资金变化曲线图配置
  const getEquityCurveOption = () => {
    if (!traderInfo.equity_curve || traderInfo.equity_curve.length === 0) {
      return {
        title: {
          text: '资金变化曲线',
          left: 'center',
        },
        tooltip: {
          trigger: 'axis',
        },
        xAxis: {
          type: 'category',
          data: [],
        },
        yAxis: {
          type: 'value',
          name: '净值 ($)',
        },
        series: [],
      }
    }

    const dates: string[] = []
    const equityData: number[] = []
    const pnlData: number[] = []

    traderInfo.equity_curve.forEach((point) => {
      const date = new Date(point.timestamp * 1000)
      dates.push(date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + 
                 ' ' + 
                 date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
      equityData.push(point.equity)
      pnlData.push(point.pnl)
    })

    return {
      title: {
        text: '资金变化曲线',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: (params: any) => {
          if (!params || !Array.isArray(params)) return ''
          let result = `<div style="padding: 8px;"><div><strong>${params[0].name || ''}</strong></div>`
          params.forEach((param: any) => {
            if (param.seriesName === '账户净值') {
              result += `<div>${param.seriesName}: <span style="color: #1890ff;">$${param.value.toFixed(2)}</span></div>`
            } else if (param.seriesName === '累计盈亏') {
              const color = param.value >= 0 ? '#52c41a' : '#ff4d4f'
              result += `<div>${param.seriesName}: <span style="color: ${color};">${param.value >= 0 ? '+' : ''}$${param.value.toFixed(2)}</span></div>`
            }
          })
          result += '</div>'
          return result
        },
      },
      legend: {
        data: ['账户净值', '累计盈亏'],
        top: 30,
      },
      grid: {
        left: '10%',
        right: '8%',
        top: '20%',
        bottom: '15%',
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLabel: {
          rotate: 45,
          fontSize: 10,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '净值 ($)',
          position: 'left',
          axisLabel: {
            formatter: '${value}',
          },
        },
        {
          type: 'value',
          name: '盈亏 ($)',
          position: 'right',
          axisLabel: {
            formatter: '${value}',
          },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          show: true,
          type: 'slider',
          top: '90%',
          start: 0,
          end: 100,
        },
      ],
      series: [
        {
          name: '账户净值',
          type: 'line',
          data: equityData,
          smooth: true,
          itemStyle: {
            color: '#1890ff',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.1)' },
              ],
            },
          },
        },
        {
          name: '累计盈亏',
          type: 'line',
          yAxisIndex: 1,
          data: pnlData,
          smooth: true,
          itemStyle: {
            color: (params: any) => {
              return params.value >= 0 ? '#52c41a' : '#ff4d4f'
            },
          },
        },
      ],
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 资金概览 */}
      {traderInfo.is_registered && (
        <Card 
          title="资金概览" 
          size="small"
          extra={
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={refreshing}
              size="small"
            >
              刷新
            </Button>
          }
        >
          <Space size="large" style={{ width: '100%', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>总资产</div>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                {formatUSD(traderInfo.account_value)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>未实现盈亏</div>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                {formatUSD(traderInfo.unrealized_pnl)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>已用保证金</div>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                {formatUSD(traderInfo.margin_used)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>可提现</div>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                {formatUSD(traderInfo.withdrawable)}
              </div>
            </div>
          </Space>
        </Card>
      )}

      {/* 交易统计信息 */}
      {traderInfo.is_registered && traderInfo.stats && (
        <Card title="交易统计" size="small">
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="总收益">
              {formatUSD(traderInfo.stats.total_realized_pnl.toString())}
            </Descriptions.Item>
            <Descriptions.Item label="总收益率">
              {formatPercent(traderInfo.stats.total_realized_pnl_pct.toString())}
            </Descriptions.Item>
            <Descriptions.Item label="胜率">
              <Text strong style={{ color: traderInfo.stats.win_rate >= 50 ? '#52c41a' : '#ff4d4f' }}>
                {traderInfo.stats.win_rate.toFixed(2)}%
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="总交易次数">
              {traderInfo.stats.total_positions}
            </Descriptions.Item>
            <Descriptions.Item label="盈利次数">
              <Tag color="green">{traderInfo.stats.win_positions}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="亏损次数">
              <Tag color="red">{traderInfo.stats.loss_positions}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="平均盈亏">
              {formatUSD(traderInfo.stats.avg_realized_pnl.toString())}
            </Descriptions.Item>
            <Descriptions.Item label="盈亏比">
              {traderInfo.stats.profit_loss_ratio > 0 ? traderInfo.stats.profit_loss_ratio.toFixed(2) : '--'}
            </Descriptions.Item>
            <Descriptions.Item label="最近30天交易数" span={2}>
              {traderInfo.stats.recent_30_days_trade_count}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* 资金变化曲线图 */}
      {traderInfo.is_registered && traderInfo.equity_curve && traderInfo.equity_curve.length > 0 && (
        <Card title="资金变化曲线" size="small">
          <div style={{ width: '100%', height: '400px' }}>
            <ReactECharts
              option={getEquityCurveOption()}
              style={{ width: '100%', height: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        </Card>
      )}

      {/* 仓位信息 - 使用 Tab */}
      {traderInfo.is_registered && (
        <Card size="small">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'current',
                label: `当前仓位${traderInfo.positions && traderInfo.positions.length > 0 ? ` (${traderInfo.positions.length})` : ''}`,
                children: (
                  <>
                    {traderInfo.positions && traderInfo.positions.length > 0 ? (
                      <Table
                        columns={positionColumns}
                        dataSource={traderInfo.positions}
                        rowKey="coin"
                        pagination={false}
                        scroll={{ x: 1200 }}
                        size="small"
                      />
                    ) : (
                      <Alert
                        message="当前无持仓"
                        description="该交易员目前没有任何持仓。"
                        type="info"
                        showIcon
                      />
                    )}
                  </>
                ),
              },
              {
                key: 'historical',
                label: `历史仓位${historicalPagination.total > 0 ? ` (${historicalPagination.total})` : ''}`,
                children: (
                  <Table
                    columns={historicalPositionColumns}
                    dataSource={historicalPositions}
                    rowKey="id"
                    loading={historicalLoading}
                    pagination={{
                      current: historicalPagination.page,
                      pageSize: historicalPagination.pageSize,
                      total: historicalPagination.total,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total) => `共 ${total} 条记录`,
                      onChange: (page, pageSize) => handleHistoricalTableChange(page, pageSize),
                      onShowSizeChange: (current, size) => handleHistoricalTableChange(1, size),
                    }}
                    scroll={{ x: 1200 }}
                    size="small"
                    locale={{
                      emptyText: historicalLoading ? '加载中...' : '暂无历史仓位记录',
                    }}
                  />
                ),
              },
              {
                key: 'kline',
                label: 'K线图',
                children: (
                  <div style={{ width: '100%', height: '600px' }}>
                    {klineLoading ? (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Spin size="large" tip="加载K线数据中..." />
                      </div>
                    ) : (
                      <ReactECharts
                        option={getKlineOption()}
                        style={{ width: '100%', height: '100%' }}
                        opts={{ renderer: 'canvas' }}
                      />
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}
    </Space>
  )
}
