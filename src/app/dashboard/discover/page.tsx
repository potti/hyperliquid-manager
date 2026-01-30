'use client'

import { useEffect, useState } from 'react'
import { Card, Table, Button, Space, message, Tooltip, Popover, Typography, Input, Form, InputNumber, Row, Col, Collapse } from 'antd'
import { ReloadOutlined, StarOutlined, StarFilled, InfoCircleOutlined, CopyOutlined, SearchOutlined, FilterOutlined, ThunderboltOutlined } from '@ant-design/icons'

const { Panel } = Collapse

const { Text, Title } = Typography
import { TraderInfo } from '@/components/copy-trading/TraderInfoModal'
import CollectionModal from '@/components/collection/CollectionModal'
import { apiClient, copyTradingApi } from '@/lib/api-client'
import { collectionApi } from '@/lib/api-client'
import { useOpenTraderTab } from '@/utils/tab-utils'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { SorterResult, FilterValue } from 'antd/es/table/interface'

// 交易员数据类型（匹配后端 WinRateStats 结构）
interface TraderData {
  address: string
  total_positions: number        // 总仓位数量（交易次数）
  win_positions: number           // 盈利仓位数量
  loss_positions: number          // 亏损仓位数量
  win_rate: number                // 胜率（百分比）
  total_realized_pnl: number      // 总已实现盈亏（总收益）
  avg_realized_pnl: number        // 平均已实现盈亏
  total_realized_pnl_pct: number  // 总已实现盈亏百分比（ROI）
  total_assets: number            // 总资产
  long_profit: number             // 做多收益
  short_profit: number            // 做空收益
  long_win_count: number          // 做多盈利次数
  short_win_count: number         // 做空盈利次数
  last_trade_time: number         // 最后交易时间（时间戳）
  trade_interval: number          // 平均交易间隔（秒）
  recent_30_days_trade_count: number // 最近30天内交易数量
  // 盈亏指标
  profit_loss_ratio?: number      // 盈亏比
  // 风险指标
  max_drawdown?: number           // 最大回撤（百分比）
  max_drawdown_value?: number     // 最大回撤金额
  sharpe_ratio?: number            // 夏普比率
  total_return?: number            // 总回报（百分比）
  equity_curve?: Array<{          // 净值曲线（可选）
    timestamp: number
    equity: number
    pnl: number
  }>
}

// 筛选条件接口
interface FilterCriteria {
  sharpeRatioMin?: number
  sharpeRatioMax?: number
  maxDrawdownMax?: number
  trade30DaysMin?: number
  trade30DaysMax?: number
  profitLossRatioMin?: number
  winRateMin?: number
  winRateMax?: number
  totalAssetsMin?: number
}

export default function DiscoverPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [traderList, setTraderList] = useState<TraderData[]>([])
  const [filteredTraderList, setFilteredTraderList] = useState<TraderData[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 100,
    total: 0,
  })

  // 打开交易员信息 Tab
  const openTraderTab = useOpenTraderTab()

  // 收藏相关状态
  const [collectionModalVisible, setCollectionModalVisible] = useState(false)
  const [currentCollectionAddress, setCurrentCollectionAddress] = useState<string>('')
  const [collectedAddresses, setCollectedAddresses] = useState<Set<string>>(new Set())

  // 搜索相关状态
  const [searchAddress, setSearchAddress] = useState<string>('')
  const [searchLoading, setSearchLoading] = useState(false)

  // 筛选相关状态
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({})

  // 应用筛选条件
  const applyFilter = (traders: TraderData[], criteria: FilterCriteria): TraderData[] => {
    return traders.filter(trader => {
      // 夏普比率
      if (criteria.sharpeRatioMin !== undefined && (trader.sharpe_ratio === undefined || trader.sharpe_ratio < criteria.sharpeRatioMin)) {
        return false
      }
      if (criteria.sharpeRatioMax !== undefined && (trader.sharpe_ratio === undefined || trader.sharpe_ratio > criteria.sharpeRatioMax)) {
        return false
      }

      // 最大回撤
      if (criteria.maxDrawdownMax !== undefined && trader.max_drawdown !== undefined) {
        const absDrawdown = Math.abs(trader.max_drawdown)
        if (absDrawdown > criteria.maxDrawdownMax) {
          return false
        }
      }

      // 30天交易单数
      if (criteria.trade30DaysMin !== undefined && (trader.recent_30_days_trade_count === undefined || trader.recent_30_days_trade_count < criteria.trade30DaysMin)) {
        return false
      }
      if (criteria.trade30DaysMax !== undefined && (trader.recent_30_days_trade_count === undefined || trader.recent_30_days_trade_count > criteria.trade30DaysMax)) {
        return false
      }

      // 盈亏比
      if (criteria.profitLossRatioMin !== undefined && (trader.profit_loss_ratio === undefined || trader.profit_loss_ratio < criteria.profitLossRatioMin)) {
        return false
      }

      // 胜率
      if (criteria.winRateMin !== undefined && (trader.win_rate === undefined || trader.win_rate < criteria.winRateMin)) {
        return false
      }
      if (criteria.winRateMax !== undefined && (trader.win_rate === undefined || trader.win_rate > criteria.winRateMax)) {
        return false
      }

      // 账户资产
      if (criteria.totalAssetsMin !== undefined && (trader.total_assets === undefined || trader.total_assets < criteria.totalAssetsMin)) {
        return false
      }

      return true
    })
  }

  // 获取交易员列表
  const fetchTraders = async () => {
    setLoading(true)
    try {
      const response = await apiClient<{ ranking: TraderData[]; total: number }>(
        `/api/v1/rank/win-rate-ranking?limit=0`
      )
      const traders = response.ranking || []
      setTraderList(traders)
      // 应用筛选
      const filtered = applyFilter(traders, filterCriteria)
      setFilteredTraderList(filtered)
      setPagination(prev => ({ ...prev, total: filtered.length }))
    } catch (error: any) {
      message.error(`获取交易员列表失败: ${error.message}`)
      setTraderList([])
      setFilteredTraderList([])
    } finally {
      setLoading(false)
    }
  }

  // 应用筛选（不重新获取数据）
  const handleApplyFilter = () => {
    const values = form.getFieldsValue()
    const criteria: FilterCriteria = {
      sharpeRatioMin: values.sharpeRatioMin,
      sharpeRatioMax: values.sharpeRatioMax,
      maxDrawdownMax: values.maxDrawdownMax,
      trade30DaysMin: values.trade30DaysMin,
      trade30DaysMax: values.trade30DaysMax,
      profitLossRatioMin: values.profitLossRatioMin,
      winRateMin: values.winRateMin,
      winRateMax: values.winRateMax,
      totalAssetsMin: values.totalAssetsMin,
    }
    setFilterCriteria(criteria)
    const filtered = applyFilter(traderList, criteria)
    setFilteredTraderList(filtered)
    setPagination(prev => ({ ...prev, current: 1, total: filtered.length }))
    message.success(`筛选完成，找到 ${filtered.length} 个交易员`)
  }

  // 重置筛选
  const handleResetFilter = () => {
    form.resetFields()
    setFilterCriteria({})
    setFilteredTraderList(traderList)
    setPagination(prev => ({ ...prev, current: 1, total: traderList.length }))
    message.info('已重置筛选条件')
  }

  // 稳健复利型预设
  const handleSteadyPreset = () => {
    const preset = {
      sharpeRatioMin: 1.5,
      sharpeRatioMax: 3.5,
      maxDrawdownMax: 20,
      trade30DaysMin: 20,
      trade30DaysMax: 90,
      profitLossRatioMin: 1.3,
      winRateMin: 55,
      winRateMax: 75,
      totalAssetsMin: 5000,
    }
    form.setFieldsValue(preset)
    message.success('已应用稳健复利型预设')
  }

  // 趋势狙击型预设
  const handleTrendPreset = () => {
    const preset = {
      sharpeRatioMin: 0.8,
      sharpeRatioMax: 2.0,
      maxDrawdownMax: 30,
      trade30DaysMin: 10,
      trade30DaysMax: 50,
      profitLossRatioMin: 2.2,
      winRateMin: 35,
      winRateMax: 50,
      totalAssetsMin: 3000,
    }
    form.setFieldsValue(preset)
    message.success('已应用趋势狙击型预设')
  }

  // 搜索交易员
  const handleSearchTrader = async () => {
    const address = searchAddress.trim()
    if (!address) {
      message.warning('请输入交易员地址')
      return
    }

    setSearchLoading(true)
    try {
      // 1. 先调用添加巨鲸地址接口
      const response = await copyTradingApi.addWhaleAddress(address)
      
      if (response.already_exists) {
        message.info(response.message)
      } else {
        message.success(response.message)
        // 刷新交易员列表
        await fetchTraders()
      }
      
      // 2. 打开交易员详情页
      openTraderTab(address)
      
      // 3. 清空搜索框
      setSearchAddress('')
    } catch (error: any) {
      message.error(`添加失败: ${error.message}`)
      // 即使添加失败，也打开详情页（可能是其他错误）
      openTraderTab(address)
    } finally {
      setSearchLoading(false)
    }
  }

  // 获取已收藏的地址列表
  const fetchCollectedAddresses = async () => {
    try {
      const response = await collectionApi.getList()
      const addresses = new Set<string>()
      response.collections.forEach((collection: any) => {
        addresses.add(collection.address)
      })
      setCollectedAddresses(addresses)
    } catch (error: any) {
      console.error('获取收藏列表失败:', error)
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchTraders()
    fetchCollectedAddresses()
  }, [])

  // 当筛选条件变化时，重新应用筛选
  useEffect(() => {
    const filtered = applyFilter(traderList, filterCriteria)
    setFilteredTraderList(filtered)
    setPagination(prev => ({ ...prev, current: 1, total: filtered.length }))
  }, [traderList])

  // 处理收藏按钮点击
  const handleCollect = (address: string) => {
    setCurrentCollectionAddress(address)
    setCollectionModalVisible(true)
  }

  // 处理表格变化（分页、排序）- 前端排序，不需要重新请求数据
  const handleTableChange = (
    newPagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<TraderData> | SorterResult<TraderData>[]
  ) => {
    // 前端分页，只更新状态
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 100,
      total: pagination.total,
    })
  }

  // 格式化地址
  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // 复制地址到剪贴板
  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      message.success('地址已复制到剪贴板')
    } catch (error) {
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea')
      textArea.value = address
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        message.success('地址已复制到剪贴板')
      } catch (err) {
        message.error('复制失败，请手动复制')
      }
      document.body.removeChild(textArea)
    }
  }

  // 查看交易员信息：打开 Tab
  const handleViewTraderInfo = (address: string) => {
    openTraderTab(address)
  }

  // 格式化货币
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '$0.00'
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  // 格式化百分比
  const formatPercent = (value: number | undefined): JSX.Element => {
    if (value === undefined || value === null || isNaN(value)) {
      return <span>0%</span>
    }
    const color = value >= 0 ? '#52c41a' : '#ff4d4f'
    const sign = value >= 0 ? '+' : ''
    return <span style={{ color, fontWeight: 500 }}>{sign}{value.toFixed(2)}%</span>
  }

  // 格式化带颜色的数值
  const formatColoredCurrency = (value: number | undefined): JSX.Element => {
    if (value === undefined || value === null || isNaN(value)) {
      return <span style={{ color: '#999' }}>$0.00</span>
    }
    const color = value >= 0 ? '#52c41a' : '#ff4d4f'
    const sign = value >= 0 ? '+' : ''
    return (
      <span style={{ color, fontWeight: 500 }}>
        {sign}{formatCurrency(Math.abs(value))}
      </span>
    )
  }

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    if (!timestamp) return '--'
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  // 格式化时间间隔
  const formatInterval = (seconds: number): string => {
    if (!seconds || seconds === 0) return '--'
    
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) {
      return `${days}天${hours}小时`
    } else if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    } else {
      return `${minutes}分钟`
    }
  }

  // 表格列配置
  const columns: ColumnsType<TraderData> = [
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 180,
      fixed: 'left',
      render: (text: string) => (
        <Space>
          <Tooltip title={text}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleViewTraderInfo(text)
              }}
              style={{ 
                fontFamily: 'monospace',
                color: '#1890ff',
                textDecoration: 'none'
              }}
            >
              {formatAddress(text)}
            </a>
          </Tooltip>
          <Tooltip title="复制地址">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleCopyAddress(text)
              }}
              style={{ 
                padding: '0 4px',
                height: 'auto',
                color: '#666'
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '总收益',
      dataIndex: 'total_realized_pnl',
      key: 'total_realized_pnl',
      width: 130,
      sorter: (a, b) => a.total_realized_pnl - b.total_realized_pnl,
      defaultSortOrder: 'descend',
      render: (value: number) => formatColoredCurrency(value),
    },
    {
      title: '胜率',
      dataIndex: 'win_rate',
      key: 'win_rate',
      width: 100,
      sorter: (a, b) => a.win_rate - b.win_rate,
      render: (value: number) => {
        if (value === undefined || value === null || isNaN(value)) {
          return <span>0%</span>
        }
        const color = value >= 70 ? '#52c41a' : value >= 50 ? '#faad14' : '#ff4d4f'
        return <span style={{ color, fontWeight: 500 }}>{value.toFixed(2)}%</span>
      },
    },
    {
      title: '总资产',
      dataIndex: 'total_assets',
      key: 'total_assets',
      width: 130,
      sorter: (a, b) => a.total_assets - b.total_assets,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: '投资回报率',
      dataIndex: 'total_realized_pnl_pct',
      key: 'total_realized_pnl_pct',
      width: 120,
      sorter: (a, b) => a.total_realized_pnl_pct - b.total_realized_pnl_pct,
      render: (value: number) => formatPercent(value),
    },
    {
      title: '做多收益',
      dataIndex: 'long_profit',
      key: 'long_profit',
      width: 130,
      sorter: (a, b) => a.long_profit - b.long_profit,
      render: (value: number) => formatColoredCurrency(value),
    },
    {
      title: '做空收益',
      dataIndex: 'short_profit',
      key: 'short_profit',
      width: 130,
      sorter: (a, b) => a.short_profit - b.short_profit,
      render: (value: number) => formatColoredCurrency(value),
    },
    {
      title: '交易次数',
      dataIndex: 'total_positions',
      key: 'total_positions',
      width: 100,
      sorter: (a, b) => a.total_positions - b.total_positions,
      render: (value: number) => value || 0,
    },
    {
      title: '30天交易数',
      dataIndex: 'recent_30_days_trade_count',
      key: 'recent_30_days_trade_count',
      width: 110,
      sorter: (a, b) => (a.recent_30_days_trade_count || 0) - (b.recent_30_days_trade_count || 0),
      render: (value: number) => value || 0,
    },
    {
      title: '做多盈利次数',
      dataIndex: 'long_win_count',
      key: 'long_win_count',
      width: 120,
      sorter: (a, b) => a.long_win_count - b.long_win_count,
      render: (value: number) => value || 0,
    },
    {
      title: '做空盈利次数',
      dataIndex: 'short_win_count',
      key: 'short_win_count',
      width: 120,
      sorter: (a, b) => a.short_win_count - b.short_win_count,
      render: (value: number) => value || 0,
    },
    {
      title: '最后交易时间',
      dataIndex: 'last_trade_time',
      key: 'last_trade_time',
      width: 180,
      sorter: (a, b) => a.last_trade_time - b.last_trade_time,
      render: (value: number) => formatTime(value),
    },
    {
      title: '交易间隔',
      dataIndex: 'trade_interval',
      key: 'trade_interval',
      width: 120,
      sorter: (a, b) => a.trade_interval - b.trade_interval,
      render: (value: number) => formatInterval(value),
    },
    {
      title: '最大回撤',
      dataIndex: 'max_drawdown',
      key: 'max_drawdown',
      width: 120,
      sorter: (a, b) => (a.max_drawdown || 0) - (b.max_drawdown || 0),
      render: (value: number | undefined) => {
        if (value === undefined || value === null || isNaN(value)) {
          return <span style={{ color: '#999' }}>--</span>
        }
        // 回撤是负数，显示为绝对值，颜色根据回撤大小判断
        const absValue = Math.abs(value)
        const color = absValue <= 15 ? '#52c41a' : absValue <= 30 ? '#faad14' : '#ff4d4f'
        return <span style={{ color, fontWeight: 500 }}>-{absValue.toFixed(2)}%</span>
      },
    },
    {
      title: '盈亏比',
      dataIndex: 'profit_loss_ratio',
      key: 'profit_loss_ratio',
      width: 100,
      sorter: (a, b) => (a.profit_loss_ratio || 0) - (b.profit_loss_ratio || 0),
      render: (value: number | undefined) => {
        if (value === undefined || value === null || isNaN(value)) {
          return <span style={{ color: '#999' }}>--</span>
        }
        const color = value >= 1.5 ? '#52c41a' : value >= 1.0 ? '#faad14' : '#ff4d4f'
        return <span style={{ color, fontWeight: 500 }}>{value.toFixed(2)}</span>
      },
    },
    {
      title: '夏普比率',
      dataIndex: 'sharpe_ratio',
      key: 'sharpe_ratio',
      width: 120,
      sorter: (a, b) => (a.sharpe_ratio || 0) - (b.sharpe_ratio || 0),
      render: (value: number | undefined) => {
        if (value === undefined || value === null || isNaN(value)) {
          return <span style={{ color: '#999' }}>--</span>
        }
        const color = value >= 2.0 ? '#52c41a' : value >= 1.0 ? '#faad14' : '#ff4d4f'
        return <span style={{ color, fontWeight: 500 }}>{value.toFixed(2)}</span>
      },
    },
    {
      title: '总回报',
      dataIndex: 'total_return',
      key: 'total_return',
      width: 120,
      sorter: (a, b) => (a.total_return || 0) - (b.total_return || 0),
      render: (value: number | undefined) => {
        if (value === undefined || value === null || isNaN(value)) {
          return <span style={{ color: '#999' }}>--</span>
        }
        return formatPercent(value)
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_: any, record: TraderData) => {
        const isCollected = collectedAddresses.has(record.address)
        return (
          <Button
            type={isCollected ? 'primary' : 'default'}
            icon={isCollected ? <StarFilled /> : <StarOutlined />}
            onClick={() => handleCollect(record.address)}
            size="small"
          >
            {isCollected ? '已收藏' : '收藏'}
          </Button>
        )
      },
    },
  ]

  // 指标说明内容
  const indicatorGuideContent = (
    <div style={{ maxWidth: 500 }}>
      <Title level={5} style={{ marginBottom: 16 }}>交易员筛选指标说明</Title>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Text strong>盈亏比</Text>
          <div style={{ marginTop: 4, marginLeft: 16 }}>
            <Text type="secondary">1.5 : 1 ~ 3 : 1</Text>
            <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
              即使胜率 40% 也能赚钱，容错率高。
            </div>
          </div>
        </div>
        <div>
          <Text strong>夏普比率</Text>
          <div style={{ marginTop: 4, marginLeft: 16 }}>
            <Text type="secondary">1.5 ~ 3.0</Text>
            <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
              收益与风险平衡，排除马丁策略和纯运气。
            </div>
          </div>
        </div>
        <div>
          <Text strong>最大回撤</Text>
          <div style={{ marginTop: 4, marginLeft: 16 }}>
            <Text type="secondary">&lt; 25%</Text>
            <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
              活着最重要，回撤太深会击穿跟单者的心理防线。
            </div>
          </div>
        </div>
        <div>
          <Text strong>Calmar比率</Text>
          <div style={{ marginTop: 4, marginLeft: 16 }}>
            <Text type="secondary">&gt; 3.0</Text>
            <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
              掉坑里能迅速爬出来，修复能力强。
            </div>
          </div>
        </div>
        <div>
          <Text strong>交易频率</Text>
          <div style={{ marginTop: 4, marginLeft: 16 }}>
            <Text type="secondary">每周 3~15 单</Text>
            <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
              排除高频机器，适合人类逻辑理解。
            </div>
          </div>
        </div>
        <div>
          <Text strong>K线相关性</Text>
          <div style={{ marginTop: 4, marginLeft: 16 }}>
            <Text type="secondary">熊市不跌 / 震荡微涨</Text>
            <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
              证明有 Alpha 能力，而非单纯吃牛市 Beta。
            </div>
          </div>
        </div>
        <div>
          <Text strong>资金费表现</Text>
          <div style={{ marginTop: 4, marginLeft: 16 }}>
            <Text type="secondary">支付与收取平衡</Text>
            <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
              排除专门撸费率的套利党。
            </div>
          </div>
        </div>
      </Space>
    </div>
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card
          title="发现交易员"
          extra={
            <Space>
              <Popover
                content={indicatorGuideContent}
                title={null}
                trigger={['hover', 'click']}
                placement="bottomRight"
                overlayStyle={{ maxWidth: 600 }}
              >
                <Button
                  type="text"
                  icon={<InfoCircleOutlined />}
                  style={{ color: '#1890ff' }}
                />
              </Popover>
              <Input
                placeholder="输入交易员地址"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onPressEnter={handleSearchTrader}
                style={{ width: 300 }}
                allowClear
              />
              <Button 
                icon={<SearchOutlined />}
                onClick={handleSearchTrader}
                loading={searchLoading}
                type="primary"
              >
                查找
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={fetchTraders}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          }
        >
          {/* 筛选器 */}
          <Collapse 
            style={{ marginBottom: 16 }}
            items={[
              {
                key: '1',
                label: (
                  <Space>
                    <FilterOutlined />
                    <span>高级筛选</span>
                    {Object.keys(filterCriteria).length > 0 && (
                      <span style={{ color: '#1890ff' }}>({Object.keys(filterCriteria).filter(k => filterCriteria[k as keyof FilterCriteria] !== undefined).length} 个条件)</span>
                    )}
                  </Space>
                ),
                children: (
                  <Form form={form} layout="vertical">
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {/* 预设按钮 */}
                      <div style={{ marginBottom: 8 }}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Space>
                            <Button 
                              type="primary"
                              icon={<ThunderboltOutlined />}
                              onClick={handleSteadyPreset}
                            >
                              稳健复利型
                            </Button>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              目标：穿越牛熊、控制回撤、资金曲线平滑向上 | 适用资金：60%-80% 跟单仓位
                            </Text>
                          </Space>
                          <Space>
                            <Button 
                              type="primary"
                              danger
                              icon={<ThunderboltOutlined />}
                              onClick={handleTrendPreset}
                            >
                              趋势狙击型
                            </Button>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              目标：抓取单边大行情，一波行情吃大部分利润 | 适用资金：20%-40% 跟单仓位
                            </Text>
                          </Space>
                        </Space>
                      </div>

                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item label="夏普比率 (Sharpe)">
                            <Space.Compact style={{ width: '100%' }}>
                              <Form.Item name="sharpeRatioMin" noStyle>
                                <InputNumber
                                  placeholder="最小值"
                                  min={0}
                                  step={0.1}
                                  style={{ width: '50%' }}
                                />
                              </Form.Item>
                              <Form.Item name="sharpeRatioMax" noStyle>
                                <InputNumber
                                  placeholder="最大值"
                                  min={0}
                                  step={0.1}
                                  style={{ width: '50%' }}
                                />
                              </Form.Item>
                            </Space.Compact>
                            <Text type="secondary" style={{ fontSize: 11 }}>推荐: 1.5 ~ 3.5</Text>
                          </Form.Item>
                        </Col>

                        <Col span={6}>
                          <Form.Item label="最大回撤 (MDD %)">
                            <Form.Item name="maxDrawdownMax" noStyle>
                              <InputNumber
                                placeholder="< 最大值"
                                min={0}
                                max={100}
                                step={1}
                                style={{ width: '100%' }}
                                addonBefore="<"
                              />
                            </Form.Item>
                            <Text type="secondary" style={{ fontSize: 11 }}>推荐: &lt; 20%</Text>
                          </Form.Item>
                        </Col>

                        <Col span={6}>
                          <Form.Item label="30天交易单数">
                            <Space.Compact style={{ width: '100%' }}>
                              <Form.Item name="trade30DaysMin" noStyle>
                                <InputNumber
                                  placeholder="最小值"
                                  min={0}
                                  step={1}
                                  style={{ width: '50%' }}
                                />
                              </Form.Item>
                              <Form.Item name="trade30DaysMax" noStyle>
                                <InputNumber
                                  placeholder="最大值"
                                  min={0}
                                  step={1}
                                  style={{ width: '50%' }}
                                />
                              </Form.Item>
                            </Space.Compact>
                            <Text type="secondary" style={{ fontSize: 11 }}>推荐: 20 ~ 90 单</Text>
                          </Form.Item>
                        </Col>

                        <Col span={6}>
                          <Form.Item label="盈亏比 (P/L Ratio)">
                            <Form.Item name="profitLossRatioMin" noStyle>
                              <InputNumber
                                placeholder="> 最小值"
                                min={0}
                                step={0.1}
                                style={{ width: '100%' }}
                                addonBefore=">"
                              />
                            </Form.Item>
                            <Text type="secondary" style={{ fontSize: 11 }}>推荐: &gt; 1.3</Text>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item label="胜率 (Win Rate %)">
                            <Space.Compact style={{ width: '100%' }}>
                              <Form.Item name="winRateMin" noStyle>
                                <InputNumber
                                  placeholder="最小值"
                                  min={0}
                                  max={100}
                                  step={1}
                                  style={{ width: '50%' }}
                                />
                              </Form.Item>
                              <Form.Item name="winRateMax" noStyle>
                                <InputNumber
                                  placeholder="最大值"
                                  min={0}
                                  max={100}
                                  step={1}
                                  style={{ width: '50%' }}
                                />
                              </Form.Item>
                            </Space.Compact>
                            <Text type="secondary" style={{ fontSize: 11 }}>推荐: 55% ~ 75%</Text>
                          </Form.Item>
                        </Col>

                        <Col span={6}>
                          <Form.Item label="账户资产 ($)">
                            <Form.Item name="totalAssetsMin" noStyle>
                              <InputNumber
                                placeholder="> 最小值"
                                min={0}
                                step={1000}
                                style={{ width: '100%' }}
                                addonBefore=">"
                              />
                            </Form.Item>
                            <Text type="secondary" style={{ fontSize: 11 }}>推荐: &gt; $5,000</Text>
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item label=" " colon={false}>
                            <Space>
                              <Button 
                                type="primary"
                                icon={<FilterOutlined />}
                                onClick={handleApplyFilter}
                              >
                                应用筛选
                              </Button>
                              <Button onClick={handleResetFilter}>
                                重置
                              </Button>
                            </Space>
                          </Form.Item>
                        </Col>
                      </Row>
                    </Space>
                  </Form>
                ),
              },
            ]}
          />

          <Table
            columns={columns}
            dataSource={filteredTraderList}
            rowKey="address"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个交易员`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 2200 }}
            locale={{
              emptyText: '暂无数据'
            }}
          />
        </Card>

        {/* 收藏弹窗 */}
        <CollectionModal
          visible={collectionModalVisible}
          address={currentCollectionAddress}
          onClose={() => {
            setCollectionModalVisible(false)
            setCurrentCollectionAddress('')
          }}
          onSuccess={() => {
            fetchCollectedAddresses()
          }}
        />
      </Space>
  )
}
