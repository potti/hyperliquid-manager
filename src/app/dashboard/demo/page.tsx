'use client'

import { useEffect, useState } from 'react'
import { Card, Table, Button, Space, Tag, Modal, Form, Input, message, Alert, Typography } from 'antd'
import { PlusOutlined, DownloadOutlined, SwapOutlined, UploadOutlined, KeyOutlined, CopyOutlined } from '@ant-design/icons'
import DashboardLayout from '@/components/DashboardLayout'
import { apiClient } from '@/lib/api-client'
import DepositModal from '@/components/wallet/DepositModal'
import AddTraderModal from '@/components/copy-trading/AddTraderModal'
import TraderSubscribeModal, { TraderInfo, SubscribeFormValues } from '@/components/copy-trading/TraderSubscribeModal'
import TraderInfoModal from '@/components/copy-trading/TraderInfoModal'

const { Paragraph, Text } = Typography

// 钱包类型定义
interface Wallet {
  id: string
  user_uuid: string
  name: string
  address: string
  status: string
  created_at: number
  updated_at: number
  hyperliquid?: {
    account_value: string      // 总资产
    unrealized_pnl: string     // 未实现盈亏
    margin_used: string        // 保证金
    withdrawable: string       // 可提现
    is_registered: boolean     // 是否已注册
  }
}

// 跟单订阅类型定义
interface CopyTradeSubscription {
  id: string
  user_uuid: string
  name: string
  trader_address: string
  wallet_address: string
  amount_type: 'ratio' | 'fixed'
  follow_coefficient?: number
  max_leverage?: number
  max_amount?: number
  min_amount?: number
  follow_amount?: number
  take_profit_pct?: number
  stop_loss_pct?: number
  enable_add_position: boolean
  follow_add_position: boolean
  follow_reduce_position: boolean
  copy_position: boolean
  reverse_follow: boolean
  margin_mode: 'margin' | 'cross' | 'isolated'
  token_whitelist?: string[]
  token_blacklist?: string[]
  status: 'active' | 'paused' | 'stopped'
  created_at: number
  updated_at: number
  trader_info?: {
    address: string
    account_value: string
    unrealized_pnl: string
    margin_used: string
    withdrawable: string
    is_registered: boolean
    position_summary: {
      total_position_value: string
      position_count: number
      long_position_count: number
      short_position_count: number
      total_unrealized_pnl: string
    }
  }
}

// 仓位类型定义（待后端接口实现）
interface Position {
  id: string
  wallet: string
  symbol: string
  type: string
  leverage: string
  direction: string
  pnl: string
  pnlValue: string
  amount: string
  positionValue: string
  entryPrice: string
  markPrice: string
  liquidationPrice: string
  margin: string
  fundingFee: string
}

export default function DemoPage() {
  const [form] = Form.useForm()

  // 钱包相关状态
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [walletsLoading, setWalletsLoading] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

  // 导出私钥相关状态
  const [exportModalVisible, setExportModalVisible] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [currentWallet, setCurrentWallet] = useState<Wallet | null>(null)
  const [privateKey, setPrivateKey] = useState<string>('')

  // 存款相关状态
  const [depositModalVisible, setDepositModalVisible] = useState(false)
  const [depositWallet, setDepositWallet] = useState<Wallet | null>(null)
  const [depositLoading, setDepositLoading] = useState(false)

  // 跟单相关状态
  const [addTraderModalVisible, setAddTraderModalVisible] = useState(false)
  const [traderInfoModalVisible, setTraderInfoModalVisible] = useState(false)
  const [traderLoading, setTraderLoading] = useState(false)
  const [currentTraderInfo, setCurrentTraderInfo] = useState<TraderInfo | null>(null)
  const [subscribeLoading, setSubscribeLoading] = useState(false)
  const [copyTradingList, setCopyTradingList] = useState<CopyTradeSubscription[]>([])
  const [copyTradingLoading, setCopyTradingLoading] = useState(false)

  // 仓位相关状态
  const [positionList, setPositionList] = useState<Position[]>([])
  const [positionLoading, setPositionLoading] = useState(false)

  // 编辑跟单相关状态
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState<CopyTradeSubscription | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  // 停止/启用跟单相关状态
  const [stopLoading, setStopLoading] = useState<string | null>(null) // 存储正在操作的订阅ID

  // 交易员信息查看窗口相关状态（从跟单列表点击）
  const [viewTraderInfoModalVisible, setViewTraderInfoModalVisible] = useState(false)
  const [viewingTraderInfo, setViewingTraderInfo] = useState<TraderInfo | null>(null)
  const [viewingTraderLoading, setViewingTraderLoading] = useState(false)

  // 获取钱包列表
  const fetchWallets = async () => {
    setWalletsLoading(true)
    try {
      const response = await apiClient<{ wallets: Wallet[] }>('/api/v1/wallet/list')
      setWallets(response.wallets || [])
    } catch (error: any) {
      message.error(`获取钱包列表失败: ${error.message}`)
    } finally {
      setWalletsLoading(false)
    }
  }

  // 创建钱包
  const handleCreateWallet = async (values: { name: string }) => {
    setCreateLoading(true)
    try {
      await apiClient('/api/v1/wallet/create', {
        method: 'POST',
        body: JSON.stringify({ name: values.name }),
      })
      message.success('钱包创建成功！')
      setCreateModalVisible(false)
      form.resetFields()
      // 刷新钱包列表
      fetchWallets()
    } catch (error: any) {
      message.error(`创建钱包失败: ${error.message}`)
    } finally {
      setCreateLoading(false)
    }
  }

  // 导出私钥
  const handleExportPrivateKey = async (wallet: Wallet) => {
    setCurrentWallet(wallet)
    setExportModalVisible(true)
    setExportLoading(true)
    setPrivateKey('')

    try {
      const response = await apiClient<{ private_key: string; warning: string }>(
        `/api/v1/wallet/${wallet.id}/export-key`
      )
      setPrivateKey(response.private_key)
    } catch (error: any) {
      message.error(`导出私钥失败: ${error.message}`)
      setExportModalVisible(false)
    } finally {
      setExportLoading(false)
    }
  }

  // 复制私钥
  const handleCopyPrivateKey = () => {
    navigator.clipboard.writeText(privateKey)
    message.success('私钥已复制到剪贴板')
  }

  // 关闭导出私钥模态框
  const handleCloseExportModal = () => {
    setExportModalVisible(false)
    setPrivateKey('')
    setCurrentWallet(null)
  }

  // 打开存款模态框
  const handleOpenDepositModal = (wallet: Wallet) => {
    setDepositWallet(wallet)
    setDepositModalVisible(true)
  }

  // 关闭存款模态框
  const handleCloseDepositModal = () => {
    setDepositModalVisible(false)
    setDepositWallet(null)
  }

  // 确认已转账
  const handleConfirmDeposit = async () => {
    if (!depositWallet) return

    setDepositLoading(true)
    try {
      const response = await apiClient<{
        success: boolean
        message: string
        balance: string
        old_status: string
        new_status: string
        next_action: string
        requires_action: boolean
      }>(`/api/v1/wallet/${depositWallet.id}/confirm-deposit`, {
        method: 'POST',
        body: JSON.stringify({}), // 使用默认最低金额 15 USDC
      })

      if (response.success) {
        message.success(response.message)
        message.info(`当前余额: ${response.balance} USDC`)
        
        if (response.requires_action) {
          message.info(response.next_action, 5)
        }

        // 刷新钱包列表以显示最新状态
        await fetchWallets()
        handleCloseDepositModal()
      } else {
        message.warning(response.message)
        if (response.next_action) {
          message.info(response.next_action, 5)
        }
      }
    } catch (error: any) {
      message.error(`确认失败: ${error.message}`)
    } finally {
      setDepositLoading(false)
    }
  }

  // 查询交易员信息
  const handleQueryTrader = async (address: string) => {
    setTraderLoading(true)
    try {
      const response = await apiClient<TraderInfo>(
        `/api/v1/copy-trading/traders?address=${encodeURIComponent(address)}`
      )
      setCurrentTraderInfo(response)
      setAddTraderModalVisible(false)
      setTraderInfoModalVisible(true)
      message.success('查询成功！')
    } catch (error: any) {
      message.error(`查询失败: ${error.message}`)
    } finally {
      setTraderLoading(false)
    }
  }

  // 查看交易员信息（从跟单列表中点击）
  const handleViewTraderInfo = async (address: string) => {
    setViewingTraderLoading(true)
    setViewTraderInfoModalVisible(true)
    try {
      const response = await apiClient<TraderInfo>(
        `/api/v1/copy-trading/traders?address=${encodeURIComponent(address)}`
      )
      setViewingTraderInfo(response)
    } catch (error: any) {
      message.error(`获取交易员信息失败: ${error.message}`)
      setViewTraderInfoModalVisible(false)
    } finally {
      setViewingTraderLoading(false)
    }
  }

  // 创建跟单
  const handleCreateSubscribe = async (values: SubscribeFormValues) => {
    if (!currentTraderInfo) {
      message.error('交易员信息不存在')
      return
    }

    setSubscribeLoading(true)
    try {
      // 构建请求体
      const requestBody: any = {
        name: values.name,
        trader_address: currentTraderInfo.address,
        wallet_address: values.wallet_address,
        amount_type: values.amount_type,
        enable_add_position: values.enable_add_position,
        follow_add_position: values.follow_add_position,
        follow_reduce_position: values.follow_reduce_position,
        copy_position: values.copy_position,
        reverse_follow: values.reverse_follow,
        margin_mode: values.margin_mode,
        token_whitelist: values.token_whitelist || [],
        token_blacklist: values.token_blacklist || [],
      }

      // 根据金额类型添加相应参数
      if (values.amount_type === 'ratio') {
        if (values.follow_coefficient !== undefined) {
          requestBody.follow_coefficient = values.follow_coefficient
        }
        if (values.max_leverage !== undefined && values.max_leverage > 0) {
          requestBody.max_leverage = values.max_leverage
        }
        if (values.max_amount !== undefined && values.max_amount > 0) {
          requestBody.max_amount = values.max_amount
        }
        if (values.min_amount !== undefined && values.min_amount > 0) {
          requestBody.min_amount = values.min_amount
        }
      } else if (values.amount_type === 'fixed') {
        if (values.follow_amount !== undefined && values.follow_amount > 0) {
          requestBody.follow_amount = values.follow_amount
        }
      }

      // 添加止盈止损
      if (values.take_profit_pct !== undefined && values.take_profit_pct > 0) {
        requestBody.take_profit_pct = values.take_profit_pct
      }
      if (values.stop_loss_pct !== undefined && values.stop_loss_pct > 0) {
        requestBody.stop_loss_pct = values.stop_loss_pct
      }

      // 调用后端接口
      const response = await apiClient('/api/v1/copy-trading/subscribe', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      message.success('跟单创建成功！')
      setTraderInfoModalVisible(false)
      setCurrentTraderInfo(null)
      
      // 刷新跟单列表
      await fetchCopyTradingList()
    } catch (error: any) {
      message.error(`创建跟单失败: ${error.message}`)
    } finally {
      setSubscribeLoading(false)
    }
  }

  // 钱包状态配置
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; text: string }> = {
      init: { color: 'default', text: '未激活' },
      pending: { color: 'processing', text: '处理中' },
      active: { color: 'success', text: '已激活' },
      disabled: { color: 'error', text: '已禁用' },
      deleted: { color: 'default', text: '已删除' },
    }
    return configs[status] || { color: 'default', text: status }
  }

  // 格式化金额显示
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
    
    // 根据盈亏显示颜色
    if (num > 0) {
      return <span style={{ color: '#52c41a', fontWeight: 500 }}>{formatted}</span>
    } else if (num < 0) {
      return <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{formatted}</span>
    }
    return <span>{formatted}</span>
  }

  // 获取跟单列表
  const fetchCopyTradingList = async () => {
    setCopyTradingLoading(true)
    try {
      const response = await apiClient<{ subscriptions: CopyTradeSubscription[]; total: number }>(
        '/api/v1/copy-trading/subscriptions'
      )
      setCopyTradingList(response.subscriptions || [])
    } catch (error: any) {
      message.error(`获取跟单列表失败: ${error.message}`)
    } finally {
      setCopyTradingLoading(false)
    }
  }

  // 获取仓位列表（待后端接口实现）
  const fetchPositions = async () => {
    setPositionLoading(true)
    try {
      // TODO: 待后端实现 /api/v1/trading/positions 接口
      // const response = await apiClient<{ positions: Position[] }>('/api/v1/trading/positions')
      // setPositionList(response.positions || [])
      setPositionList([]) // 暂时为空数组
    } catch (error: any) {
      message.error(`获取仓位列表失败: ${error.message}`)
    } finally {
      setPositionLoading(false)
    }
  }

  // 打开编辑模态框
  const handleEditSubscription = async (subscription: CopyTradeSubscription) => {
    setEditLoading(true)
    try {
      // 获取跟单详情（包含交易员信息）
      const response = await apiClient<{ subscription: CopyTradeSubscription; trader_info?: TraderInfo }>(
        `/api/v1/copy-trading/subscribe/${subscription.id}`
      )
      // 将 trader_info 合并到 subscription 中
      const subscriptionWithTraderInfo: CopyTradeSubscription = {
        ...response.subscription,
        trader_info: response.trader_info || response.subscription.trader_info,
      }
      setCurrentSubscription(subscriptionWithTraderInfo)
      setEditModalVisible(true)
    } catch (error: any) {
      message.error(`获取跟单详情失败: ${error.message}`)
    } finally {
      setEditLoading(false)
    }
  }

  // 更新跟单
  const handleUpdateSubscription = async (values: SubscribeFormValues) => {
    if (!currentSubscription) return

    setEditLoading(true)
    try {
      // 构建请求体（只包含需要更新的字段）
      const requestBody: any = {}

      // 名称
      if (values.name !== currentSubscription.name) {
        requestBody.name = values.name
      }

      // 金额类型
      if (values.amount_type !== currentSubscription.amount_type) {
        requestBody.amount_type = values.amount_type
      }

      // 根据金额类型添加相应参数
      if (values.amount_type === 'ratio') {
        if (values.follow_coefficient !== undefined && values.follow_coefficient !== currentSubscription.follow_coefficient) {
          requestBody.follow_coefficient = values.follow_coefficient
        }
        if (values.max_leverage !== undefined && values.max_leverage !== currentSubscription.max_leverage) {
          requestBody.max_leverage = values.max_leverage
        }
        if (values.max_amount !== undefined && values.max_amount !== currentSubscription.max_amount) {
          requestBody.max_amount = values.max_amount
        }
        if (values.min_amount !== undefined && values.min_amount !== currentSubscription.min_amount) {
          requestBody.min_amount = values.min_amount
        }
      } else if (values.amount_type === 'fixed') {
        if (values.follow_amount !== undefined && values.follow_amount !== currentSubscription.follow_amount) {
          requestBody.follow_amount = values.follow_amount
        }
      }

      // 止盈止损
      if (values.take_profit_pct !== undefined && values.take_profit_pct !== currentSubscription.take_profit_pct) {
        requestBody.take_profit_pct = values.take_profit_pct
      }
      if (values.stop_loss_pct !== undefined && values.stop_loss_pct !== currentSubscription.stop_loss_pct) {
        requestBody.stop_loss_pct = values.stop_loss_pct
      }

      // 开关选项
      if (values.enable_add_position !== currentSubscription.enable_add_position) {
        requestBody.enable_add_position = values.enable_add_position
      }
      if (values.follow_add_position !== currentSubscription.follow_add_position) {
        requestBody.follow_add_position = values.follow_add_position
      }
      if (values.follow_reduce_position !== currentSubscription.follow_reduce_position) {
        requestBody.follow_reduce_position = values.follow_reduce_position
      }
      if (values.copy_position !== currentSubscription.copy_position) {
        requestBody.copy_position = values.copy_position
      }
      if (values.reverse_follow !== currentSubscription.reverse_follow) {
        requestBody.reverse_follow = values.reverse_follow
      }

      // 跟单模式
      if (values.margin_mode !== currentSubscription.margin_mode) {
        requestBody.margin_mode = values.margin_mode
      }

      // 代币黑白名单
      const whitelistChanged = JSON.stringify(values.token_whitelist || []) !== JSON.stringify(currentSubscription.token_whitelist || [])
      const blacklistChanged = JSON.stringify(values.token_blacklist || []) !== JSON.stringify(currentSubscription.token_blacklist || [])
      if (whitelistChanged) {
        requestBody.token_whitelist = values.token_whitelist || []
      }
      if (blacklistChanged) {
        requestBody.token_blacklist = values.token_blacklist || []
      }

      // 调用更新接口
      await apiClient(`/api/v1/copy-trading/subscribe/${currentSubscription.id}`, {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      })

      message.success('跟单更新成功！')
      setEditModalVisible(false)
      setCurrentSubscription(null)
      
      // 刷新跟单列表
      await fetchCopyTradingList()
    } catch (error: any) {
      message.error(`更新跟单失败: ${error.message}`)
    } finally {
      setEditLoading(false)
    }
  }

  // 停止跟单
  const handleStopSubscription = async (subscription: CopyTradeSubscription) => {
    Modal.confirm({
      title: '确认停止跟单',
      content: `确定要停止跟单"${subscription.name}"吗？停止后将无法继续跟单。`,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        setStopLoading(subscription.id)
        try {
          await apiClient(`/api/v1/copy-trading/subscribe/${subscription.id}`, {
            method: 'DELETE',
          })
          message.success('跟单已停止')
          // 刷新跟单列表
          await fetchCopyTradingList()
        } catch (error: any) {
          message.error(`停止跟单失败: ${error.message}`)
        } finally {
          setStopLoading(null)
        }
      },
    })
  }

  // 启用跟单
  const handleEnableSubscription = async (subscription: CopyTradeSubscription) => {
    Modal.confirm({
      title: '确认启用跟单',
      content: `确定要启用跟单"${subscription.name}"吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setStopLoading(subscription.id)
        try {
          await apiClient(`/api/v1/copy-trading/subscribe/${subscription.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              status: 'active',
            }),
          })
          message.success('跟单已启用')
          // 刷新跟单列表
          await fetchCopyTradingList()
        } catch (error: any) {
          message.error(`启用跟单失败: ${error.message}`)
        } finally {
          setStopLoading(null)
        }
      },
    })
  }

  // 组件挂载时获取钱包列表和跟单列表
  useEffect(() => {
    fetchWallets()
    fetchCopyTradingList()
    // fetchPositions() // 待后端接口实现后启用
  }, [])

  // 钱包列表列配置
  const walletColumns = [
    {
      title: '钱包名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '钱包地址',
      dataIndex: 'address',
      key: 'address',
      width: 180,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace' }}>{text}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = getStatusConfig(status)
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '总资产',
      key: 'totalAssets',
      width: 130,
      render: (_, record: Wallet) => formatUSD(record.hyperliquid?.account_value),
    },
    {
      title: '未实现盈亏',
      key: 'unrealizedPnl',
      width: 140,
      render: (_, record: Wallet) => {
        const value = record.hyperliquid?.unrealized_pnl
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
          signDisplay: 'always', // 显示 +/- 符号
        }).format(num)
        
        const color = num >= 0 ? '#52c41a' : '#ff4d4f'
        return <span style={{ color, fontWeight: 500 }}>{formatted}</span>
      },
    },
    {
      title: '保证金',
      key: 'margin',
      width: 130,
      render: (_, record: Wallet) => formatUSD(record.hyperliquid?.margin_used),
    },
    {
      title: '可提现',
      key: 'withdrawable',
      width: 130,
      render: (_, record: Wallet) => formatUSD(record.hyperliquid?.withdrawable),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button 
            type="link" 
            size="small" 
            icon={<DownloadOutlined />}
            onClick={() => handleOpenDepositModal(record)}
          >
            存款
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<SwapOutlined />}
            onClick={() => message.info(`转账功能开发中 - 钱包: ${record.name}`)}
          >
            转账
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<UploadOutlined />}
            onClick={() => message.info(`提现功能开发中 - 钱包: ${record.name}`)}
          >
            提现
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<KeyOutlined />}
            onClick={() => handleExportPrivateKey(record)}
            danger
          >
            导出私钥
          </Button>
        </Space>
      ),
    },
  ]

  // 格式化地址显示（截取前后部分）
  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // 格式化状态显示
  const getCopyTradingStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; text: string }> = {
      active: { color: 'success', text: '运行中' },
      paused: { color: 'warning', text: '已暂停' },
      stopped: { color: 'error', text: '已停止' },
    }
    return configs[status] || { color: 'default', text: status }
  }

  // 计算保证金使用率
  const calculateMarginUsage = (subscription: CopyTradeSubscription): string => {
    if (!subscription.trader_info) return '--'
    const accountValue = parseFloat(subscription.trader_info.account_value || '0')
    const marginUsed = parseFloat(subscription.trader_info.margin_used || '0')
    if (accountValue === 0) return '0%'
    const usage = (marginUsed / accountValue) * 100
    return `${usage.toFixed(2)}%`
  }

  // 跟单列表列配置
  const copyTradingColumns = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = getCopyTradingStatusConfig(status)
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '网络',
      key: 'network',
      width: 100,
      render: () => <span style={{ color: '#999' }}>--</span>, // 暂时留空
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text: string) => <Text strong>{text || '--'}</Text>,
    },
    {
      title: '交易钱包',
      dataIndex: 'wallet_address',
      key: 'wallet_address',
      width: 150,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace' }} title={text}>
          {formatAddress(text)}
        </span>
      ),
    },
    {
      title: '被跟单钱包',
      dataIndex: 'trader_address',
      key: 'trader_address',
      width: 150,
      render: (text: string) => (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            handleViewTraderInfo(text)
          }}
          style={{ fontFamily: 'monospace', color: '#1890ff' }}
          title={text}
        >
          {formatAddress(text)}
        </a>
      ),
    },
    {
      title: '可用余额',
      key: 'availableBalance',
      width: 130,
      render: (_: any, record: CopyTradeSubscription) => {
        if (!record.trader_info) {
          return <span style={{ color: '#999' }}>--</span>
        }
        return formatUSD(record.trader_info.withdrawable)
      },
    },
    {
      title: '保证金使用率',
      key: 'marginUsage',
      width: 120,
      render: (_: any, record: CopyTradeSubscription) => {
        const usage = calculateMarginUsage(record)
        if (usage === '--') {
          return <span style={{ color: '#999' }}>--</span>
        }
        const value = parseFloat(usage.replace('%', ''))
        const color = value > 80 ? '#ff4d4f' : value > 60 ? '#faad14' : '#52c41a'
        return <span style={{ color }}>{usage}</span>
      },
    },
    {
      title: '未实现利润',
      key: 'unrealizedProfit',
      width: 130,
      render: (_: any, record: CopyTradeSubscription) => {
        if (!record.trader_info) {
          return <span style={{ color: '#999' }}>--</span>
        }
        const pnl = record.trader_info.unrealized_pnl
        if (!pnl || pnl === '0' || pnl === '0.00') {
          return <span style={{ color: '#999' }}>$0.00</span>
        }
        const num = parseFloat(pnl)
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          signDisplay: 'always',
        }).format(num)
        const color = num >= 0 ? '#52c41a' : '#ff4d4f'
        return <span style={{ color, fontWeight: 500 }}>{formatted}</span>
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: CopyTradeSubscription) => {
        const isStopped = record.status === 'stopped'
        return (
          <Space size="small">
            <Button 
              type="link" 
              size="small" 
              onClick={() => handleEditSubscription(record)}
              disabled={stopLoading === record.id}
            >
              编辑
            </Button>
            {isStopped ? (
              <Button 
                type="link" 
                size="small" 
                onClick={() => handleEnableSubscription(record)}
                loading={stopLoading === record.id}
                disabled={stopLoading !== null}
              >
                启用
              </Button>
            ) : (
              <Button 
                type="link" 
                size="small" 
                danger 
                onClick={() => handleStopSubscription(record)}
                loading={stopLoading === record.id}
                disabled={stopLoading !== null}
              >
                停止
              </Button>
            )}
          </Space>
        )
      },
    },
  ]

  // 仓位列表列配置
  const positionColumns = [
    {
      title: '钱包',
      dataIndex: 'wallet',
      key: 'wallet',
      width: 140,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace' }}>{text}</span>
      ),
    },
    {
      title: '币种',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 120,
    },
    {
      title: '全仓',
      dataIndex: 'type',
      key: 'type',
      width: 80,
    },
    {
      title: '杠杆',
      dataIndex: 'leverage',
      key: 'leverage',
      width: 80,
    },
    {
      title: '方向',
      dataIndex: 'direction',
      key: 'direction',
      width: 80,
      render: (text: string) => (
        <Tag color={text === '多' ? 'green' : 'red'}>{text}</Tag>
      ),
    },
    {
      title: '盈亏（ROE %）',
      dataIndex: 'pnl',
      key: 'pnl',
      width: 150,
      render: (text: string, record: any) => (
        <div>
          <div style={{ color: text.includes('+') ? '#52c41a' : '#f5222d', fontWeight: 'bold' }}>
            {text}
          </div>
          <div style={{ fontSize: '12px', color: text.includes('+') ? '#52c41a' : '#f5222d' }}>
            {record.pnlValue}
          </div>
        </div>
      ),
    },
    {
      title: '数量',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
    },
    {
      title: '仓位价值',
      dataIndex: 'positionValue',
      key: 'positionValue',
      width: 130,
    },
    {
      title: '开仓价格',
      dataIndex: 'entryPrice',
      key: 'entryPrice',
      width: 120,
    },
    {
      title: '标记价格',
      dataIndex: 'markPrice',
      key: 'markPrice',
      width: 120,
    },
    {
      title: '强平价格',
      dataIndex: 'liquidationPrice',
      key: 'liquidationPrice',
      width: 120,
    },
    {
      title: '保证金',
      dataIndex: 'margin',
      key: 'margin',
      width: 120,
    },
    {
      title: '资金费',
      dataIndex: 'fundingFee',
      key: 'fundingFee',
      width: 100,
      render: (text: string) => (
        <span style={{ color: text.includes('+') ? '#52c41a' : '#f5222d' }}>
          {text}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      render: () => (
        <Space size="small">
          <Button type="link" size="small">平仓</Button>
          <Button type="link" size="small">调整</Button>
        </Space>
      ),
    },
  ]

  // 计算总资产统计
  const calculateTotals = () => {
    let totalAssets = 0
    let totalPnl = 0
    let totalMargin = 0
    let totalWithdrawable = 0

    wallets.forEach(wallet => {
      if (wallet.hyperliquid?.is_registered) {
        totalAssets += parseFloat(wallet.hyperliquid.account_value || '0')
        totalPnl += parseFloat(wallet.hyperliquid.unrealized_pnl || '0')
        totalMargin += parseFloat(wallet.hyperliquid.margin_used || '0')
        totalWithdrawable += parseFloat(wallet.hyperliquid.withdrawable || '0')
      }
    })

    return { totalAssets, totalPnl, totalMargin, totalWithdrawable }
  }

  const totals = calculateTotals()

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 总资产概览卡片 */}
        {wallets.length > 0 && (
          <Card>
            <Space size="large" style={{ width: '100%', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#999', fontSize: 14 }}>总资产</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                  {formatUSD(totals.totalAssets.toFixed(2))}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#999', fontSize: 14 }}>未实现盈亏</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                  {totals.totalPnl >= 0 ? '+' : ''}{formatUSD(totals.totalPnl.toFixed(2))}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#999', fontSize: 14 }}>总保证金</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                  {formatUSD(totals.totalMargin.toFixed(2))}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#999', fontSize: 14 }}>可提现</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                  {formatUSD(totals.totalWithdrawable.toFixed(2))}
                </div>
              </div>
            </Space>
          </Card>
        )}

        {/* 第一部分：我的钱包列表 */}
        <Card
          title="我的钱包"
          extra={
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建钱包
            </Button>
          }
        >
          <Table
            columns={walletColumns}
            dataSource={wallets}
            rowKey="id"
            loading={walletsLoading}
            pagination={false}
            scroll={{ x: 1400 }}
            locale={{
              emptyText: '暂无钱包，点击右上角按钮创建'
            }}
          />
        </Card>

        {/* 创建钱包模态框 */}
        <Modal
          title="创建钱包"
          open={createModalVisible}
          onOk={() => form.submit()}
          onCancel={() => {
            setCreateModalVisible(false)
            form.resetFields()
          }}
          confirmLoading={createLoading}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateWallet}
          >
            <Form.Item
              label="钱包名称"
              name="name"
              rules={[
                { required: true, message: '请输入钱包名称' },
                { min: 1, max: 50, message: '钱包名称长度应在1-50个字符之间' }
              ]}
            >
              <Input placeholder="例如：主钱包、交易钱包1" />
            </Form.Item>
          </Form>
        </Modal>

        {/* 导出私钥模态框 */}
        <Modal
          title={
            <span>
              <KeyOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
              导出私钥
            </span>
          }
          open={exportModalVisible}
          onCancel={handleCloseExportModal}
          footer={[
            <Button key="close" onClick={handleCloseExportModal}>
              关闭
            </Button>,
            <Button
              key="copy"
              type="primary"
              icon={<CopyOutlined />}
              onClick={handleCopyPrivateKey}
              disabled={!privateKey || exportLoading}
            >
              复制私钥
            </Button>,
          ]}
          width={600}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              message="安全警告"
              description="私钥是您钱包的唯一凭证，请妥善保管！任何人获得您的私钥都可以完全控制您的资产。请勿将私钥分享给任何人，也不要通过网络传输。"
              type="error"
              showIcon
            />

            <div>
              <Text strong>钱包名称：</Text>
              <Text>{currentWallet?.name}</Text>
            </div>

            <div>
              <Text strong>钱包地址：</Text>
              <Paragraph copyable style={{ fontFamily: 'monospace', marginBottom: 0 }}>
                {currentWallet?.address}
              </Paragraph>
            </div>

            <div>
              <Text strong>私钥：</Text>
              {exportLoading ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Text type="secondary">正在解密私钥...</Text>
                </div>
              ) : privateKey ? (
                <Paragraph
                  copyable
                  style={{
                    fontFamily: 'monospace',
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 4,
                    wordBreak: 'break-all',
                    marginBottom: 0,
                  }}
                >
                  {privateKey}
                </Paragraph>
              ) : null}
            </div>

            <Alert
              message="请务必离线保存"
              description="建议您将私钥抄写在纸上并妥善保管，或使用专业的硬件钱包存储。切勿截图或保存在联网的设备上。"
              type="warning"
              showIcon
            />
          </Space>
        </Modal>

        {/* 存款模态框 */}
        {depositWallet && (
          <DepositModal
            visible={depositModalVisible}
            walletAddress={depositWallet.address}
            walletName={depositWallet.name}
            onClose={handleCloseDepositModal}
            onConfirm={handleConfirmDeposit}
            loading={depositLoading}
          />
        )}

        {/* 第二部分：我的跟单 */}
        <Card
          title="我的跟单"
          extra={
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setAddTraderModalVisible(true)}
            >
              创建跟单
            </Button>
          }
        >
          <Table
            columns={copyTradingColumns}
            dataSource={copyTradingList}
            rowKey="id"
            loading={copyTradingLoading}
            pagination={false}
            scroll={{ x: 1500 }}
            locale={{
              emptyText: '暂无跟单任务，点击右上角按钮创建'
            }}
          />
        </Card>

        {/* 第三部分：仓位 */}
        <Card title="仓位">
          <Table
            columns={positionColumns}
            dataSource={positionList}
            rowKey="id"
            loading={positionLoading}
            pagination={false}
            scroll={{ x: 2000 }}
            locale={{
              emptyText: '暂无仓位数据'
            }}
          />
        </Card>

        {/* 添加交易员模态框 */}
        <AddTraderModal
          visible={addTraderModalVisible}
          loading={traderLoading}
          onConfirm={handleQueryTrader}
          onCancel={() => setAddTraderModalVisible(false)}
        />

        {/* 交易员信息与创建跟单模态框（合并） */}
        <TraderSubscribeModal
          visible={traderInfoModalVisible}
          traderInfo={currentTraderInfo}
          loading={subscribeLoading}
          onConfirm={handleCreateSubscribe}
          onCancel={() => {
            setTraderInfoModalVisible(false)
            setCurrentTraderInfo(null)
          }}
          mode="create"
        />

        {/* 编辑跟单模态框 */}
        <TraderSubscribeModal
          visible={editModalVisible}
          traderInfo={currentSubscription?.trader_info || null}
          loading={editLoading}
          onConfirm={handleUpdateSubscription}
          onCancel={() => {
            setEditModalVisible(false)
            setCurrentSubscription(null)
          }}
          mode="edit"
          subscription={currentSubscription}
        />

        {/* 交易员信息查看窗口（从跟单列表点击） */}
        {viewTraderInfoModalVisible && (
          <>
            {viewingTraderLoading ? (
              <Modal
                title="交易员信息"
                open={viewTraderInfoModalVisible}
                onCancel={() => {
                  setViewTraderInfoModalVisible(false)
                  setViewingTraderInfo(null)
                }}
                footer={null}
                width={1400}
              >
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Text type="secondary">正在加载交易员信息...</Text>
                </div>
              </Modal>
            ) : viewingTraderInfo ? (
              <TraderInfoModal
                visible={viewTraderInfoModalVisible}
                traderInfo={viewingTraderInfo}
                onClose={() => {
                  setViewTraderInfoModalVisible(false)
                  setViewingTraderInfo(null)
                }}
              />
            ) : null}
          </>
        )}
      </Space>
    </DashboardLayout>
  )
}

