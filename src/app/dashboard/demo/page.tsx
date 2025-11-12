'use client'

import { useEffect, useState } from 'react'
import { Card, Table, Button, Space, Tag, Modal, Form, Input, message, Alert, Typography } from 'antd'
import { PlusOutlined, DownloadOutlined, SwapOutlined, UploadOutlined, KeyOutlined, CopyOutlined } from '@ant-design/icons'
import DashboardLayout from '@/components/DashboardLayout'
import { apiClient } from '@/lib/api-client'
import DepositModal from '@/components/wallet/DepositModal'
import AddTraderModal from '@/components/copy-trading/AddTraderModal'
import TraderInfoModal, { TraderInfo } from '@/components/copy-trading/TraderInfoModal'

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

// 跟单列表数据
const copyTradingData = [
  {
    key: '1',
    status: 'active',
    network: 'Ethereum',
    taskName: '跟单任务-001',
    tradingWallet: '0x742d...0bEb',
    followedWallet: '0x8ba1...DBA72',
    availableBalance: '$50,000.00',
    marginUsage: '65%',
    unrealizedProfit: '+$3,450.00',
  },
  {
    key: '2',
    status: 'paused',
    network: 'BSC',
    taskName: '跟单任务-002',
    tradingWallet: '0x8ba1...DBA72',
    followedWallet: '0x9cd2...EF93',
    availableBalance: '$30,000.00',
    marginUsage: '42%',
    unrealizedProfit: '-$850.00',
  },
]

// 仓位列表数据
const positionData = [
  {
    key: '1',
    wallet: '0x742d...0bEb',
    symbol: 'BTC/USDT',
    type: '全仓',
    leverage: '10x',
    direction: '多',
    pnl: '+15.23%',
    pnlValue: '+$6,850.00',
    amount: '0.5 BTC',
    positionValue: '$45,000.00',
    entryPrice: '$89,500.00',
    markPrice: '$92,350.00',
    liquidationPrice: '$82,100.00',
    margin: '$4,500.00',
    fundingFee: '-$23.50',
  },
  {
    key: '2',
    wallet: '0x8ba1...DBA72',
    symbol: 'ETH/USDT',
    type: '全仓',
    leverage: '5x',
    direction: '空',
    pnl: '-8.45%',
    pnlValue: '-$1,690.00',
    amount: '10 ETH',
    positionValue: '$20,000.00',
    entryPrice: '$2,050.00',
    markPrice: '$2,223.00',
    liquidationPrice: '$2,400.00',
    margin: '$4,000.00',
    fundingFee: '+$12.30',
  },
]

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

  // 创建跟单
  const handleSubscribeTrader = (traderInfo: TraderInfo) => {
    // TODO: 实现创建跟单逻辑
    message.info('创建跟单功能开发中...')
    console.log('创建跟单:', traderInfo)
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

  // 组件挂载时获取钱包列表
  useEffect(() => {
    fetchWallets()
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

  // 跟单列表列配置
  const copyTradingColumns = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? '运行中' : '已暂停'}
        </Tag>
      ),
    },
    {
      title: '网络',
      dataIndex: 'network',
      key: 'network',
      width: 100,
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 150,
    },
    {
      title: '交易钱包',
      dataIndex: 'tradingWallet',
      key: 'tradingWallet',
      width: 150,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace' }}>{text}</span>
      ),
    },
    {
      title: '被跟单钱包',
      dataIndex: 'followedWallet',
      key: 'followedWallet',
      width: 150,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace' }}>{text}</span>
      ),
    },
    {
      title: '可用余额',
      dataIndex: 'availableBalance',
      key: 'availableBalance',
      width: 130,
    },
    {
      title: '保证金使用率',
      dataIndex: 'marginUsage',
      key: 'marginUsage',
      width: 120,
      render: (text: string) => {
        const value = parseInt(text)
        const color = value > 80 ? 'red' : value > 60 ? 'orange' : 'green'
        return <span style={{ color }}>{text}</span>
      },
    },
    {
      title: '未实现利润',
      dataIndex: 'unrealizedProfit',
      key: 'unrealizedProfit',
      width: 130,
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
          <Button type="link" size="small">编辑</Button>
          <Button type="link" size="small" danger>停止</Button>
        </Space>
      ),
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
            dataSource={copyTradingData}
            pagination={false}
            scroll={{ x: 1500 }}
          />
        </Card>

        {/* 第三部分：仓位 */}
        <Card title="仓位">
          <Table
            columns={positionColumns}
            dataSource={positionData}
            pagination={false}
            scroll={{ x: 2000 }}
          />
        </Card>

        {/* 添加交易员模态框 */}
        <AddTraderModal
          visible={addTraderModalVisible}
          loading={traderLoading}
          onConfirm={handleQueryTrader}
          onCancel={() => setAddTraderModalVisible(false)}
        />

        {/* 交易员信息模态框 */}
        <TraderInfoModal
          visible={traderInfoModalVisible}
          traderInfo={currentTraderInfo}
          onClose={() => setTraderInfoModalVisible(false)}
          onSubscribe={handleSubscribeTrader}
        />
      </Space>
    </DashboardLayout>
  )
}

