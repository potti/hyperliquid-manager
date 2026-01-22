'use client'

import { useEffect, useState } from 'react'
import { Card, Table, Button, Space, message, Tooltip, Popover, Typography } from 'antd'
import { ReloadOutlined, StarOutlined, StarFilled, InfoCircleOutlined } from '@ant-design/icons'

const { Text, Title } = Typography
import DashboardLayout from '@/components/DashboardLayout'
import TraderInfoModal, { TraderInfo } from '@/components/copy-trading/TraderInfoModal'
import CollectionModal from '@/components/collection/CollectionModal'
import { apiClient } from '@/lib/api-client'
import { collectionApi } from '@/lib/api-client'
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

export default function DiscoverPage() {
  const [loading, setLoading] = useState(false)
  const [traderList, setTraderList] = useState<TraderData[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  // 交易员信息弹框相关状态
  const [traderInfoModalVisible, setTraderInfoModalVisible] = useState(false)
  const [currentTraderInfo, setCurrentTraderInfo] = useState<TraderInfo | null>(null)
  const [traderInfoLoading, setTraderInfoLoading] = useState(false)

  // 收藏相关状态
  const [collectionModalVisible, setCollectionModalVisible] = useState(false)
  const [currentCollectionAddress, setCurrentCollectionAddress] = useState<string>('')
  const [collectedAddresses, setCollectedAddresses] = useState<Set<string>>(new Set())

  // 获取交易员列表
  const fetchTraders = async () => {
    setLoading(true)
    try {
      const response = await apiClient<{ ranking: TraderData[]; total: number }>(
        `/api/v1/rank/win-rate-ranking?limit=0`
      )
      setTraderList(response.ranking || [])
      setPagination(prev => ({ ...prev, total: response.total || 0 }))
    } catch (error: any) {
      message.error(`获取交易员列表失败: ${error.message}`)
      setTraderList([])
    } finally {
      setLoading(false)
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
      pageSize: newPagination.pageSize || 20,
      total: pagination.total,
    })
  }

  // 格式化地址
  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // 查看交易员信息
  const handleViewTraderInfo = async (address: string) => {
    setTraderInfoLoading(true)
    setCurrentTraderInfo(null)
    
    try {
      const response = await apiClient<TraderInfo>(
        `/api/v1/copy-trading/traders?address=${encodeURIComponent(address)}`
      )
      setCurrentTraderInfo(response)
      setTraderInfoModalVisible(true)
    } catch (error: any) {
      message.error(`获取交易员信息失败: ${error.message}`)
    } finally {
      setTraderInfoLoading(false)
    }
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
      width: 150,
      fixed: 'left',
      render: (text: string) => (
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
    <DashboardLayout>
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
          <Table
            columns={columns}
            dataSource={traderList}
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

        {/* 交易员信息弹框 */}
        <TraderInfoModal
          visible={traderInfoModalVisible}
          traderInfo={currentTraderInfo}
          onClose={() => {
            setTraderInfoModalVisible(false)
            setCurrentTraderInfo(null)
          }}
        />

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
    </DashboardLayout>
  )
}
