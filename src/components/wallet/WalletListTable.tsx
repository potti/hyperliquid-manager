'use client'

import { useState } from 'react'
import { Table, Button, Tag, Space, message, Popconfirm, Empty } from 'antd'
import {
  DownloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import DepositModal from '@/components/wallet/DepositModal'
import WithdrawModal from '@/components/wallet/WithdrawModal'
import { walletApi, apiClient } from '@/lib/api-client'
import { normalizeWalletsHyperliquid, toFiniteNumber } from '@/utils/wallet-hyperliquid'

interface Wallet {
  id: string
  name: string
  address: string
  status: string
  account_value?: string | number
  unrealized_pnl?: string | number
  margin_used?: string | number
  withdrawable?: string | number
  is_registered?: boolean
  predict_registered?: boolean
  predict_error?: string
  hyperliquid?: {
    account_value: string | number
    unrealized_pnl: string | number
    margin_used: string | number
    withdrawable: string | number
    is_registered: boolean
  }
}

interface WalletListTableProps {
  wallets: Wallet[]
  loading?: boolean
  onRefresh: () => void
}

// 格式化地址显示
const formatAddress = (address: string) => {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// 状态配置
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

// 格式化金额
const formatUSD = (value: string | number | undefined | null) => {
  if (value === undefined || value === null || value === '') {
    return <span style={{ color: '#999' }}>$0.00</span>
  }
  const num = typeof value === 'number' ? value : parseFloat(String(value).trim())
  if (!Number.isFinite(num)) {
    return <span style={{ color: '#999' }}>--</span>
  }
  if (num === 0) {
    return <span style={{ color: '#999' }}>$0.00</span>
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

// PnL 显示（带 +/- 符号）
const formatPnL = (value: string | number | undefined | null) => {
  if (value === undefined || value === null || value === '') {
    return <span style={{ color: '#999' }}>$0.00</span>
  }
  const num = typeof value === 'number' ? value : parseFloat(String(value).trim())
  if (!Number.isFinite(num)) {
    return <span style={{ color: '#999' }}>--</span>
  }
  if (num === 0) {
    return <span style={{ color: '#999' }}>$0.00</span>
  }
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'always',
  }).format(num)

  const color = num >= 0 ? '#52c41a' : '#ff4d4f'
  return <span style={{ color, fontWeight: 500 }}>{formatted}</span>
}

export default function WalletListTable({ wallets, loading = false, onRefresh }: WalletListTableProps) {
  const [depositModalVisible, setDepositModalVisible] = useState(false)
  const [depositWallet, setDepositWallet] = useState<Wallet | null>(null)
  const [depositLoading, setDepositLoading] = useState(false)

  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false)
  const [withdrawWallet, setWithdrawWallet] = useState<Wallet | null>(null)
  const [withdrawLoading, setWithdrawLoading] = useState(false)

  // 打开存款模态框
  const handleOpenDeposit = (wallet: Wallet) => {
    setDepositWallet(wallet)
    setDepositModalVisible(true)
  }

  // 确认存款
  const handleConfirmDeposit = async () => {
    if (!depositWallet) return
    setDepositLoading(true)
    try {
      const result = await apiClient(`/api/v1/wallet/${depositWallet.id}/confirm-deposit`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      if (result?.success || result?.data?.success) {
        message.success('存款确认成功')
        onRefresh()
        setDepositModalVisible(false)
        setDepositWallet(null)
      } else {
        message.warning(result?.data?.message || result?.message || '操作完成')
      }
    } catch (error: any) {
      message.error(`确认失败: ${error.message}`)
    } finally {
      setDepositLoading(false)
    }
  }

  // 打开提现模态框
  const handleOpenWithdraw = (wallet: Wallet) => {
    setWithdrawWallet(wallet)
    setWithdrawModalVisible(true)
  }

  // 确认提现
  const handleConfirmWithdraw = async (amount: number, destination: string) => {
    if (!withdrawWallet) return
    setWithdrawLoading(true)
    try {
      const result = await apiClient(`/api/v1/wallet/${withdrawWallet.id}/withdraw`, {
        method: 'POST',
        body: JSON.stringify({ amount, destination }),
      })
      if (result?.success || result?.data?.success) {
        message.success(`提现成功: ${amount} USDC`)
        onRefresh()
        setWithdrawModalVisible(false)
        setWithdrawWallet(null)
      } else {
        throw new Error(result?.data?.message || result?.message || '提现失败')
      }
    } catch (error: any) {
      message.error(error.message || '提现失败')
    } finally {
      setWithdrawLoading(false)
    }
  }

  // 删除钱包
  const handleDelete = async (wallet: Wallet) => {
    try {
      await walletApi.delete(wallet.id)
      message.success('钱包已删除')
      onRefresh()
    } catch (error: any) {
      message.error(`删除失败: ${error.message}`)
    }
  }

  const columns = [
    {
      title: '钱包名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 160,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{formatAddress(text)}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: '未激活', value: 'init' },
        { text: '处理中', value: 'pending' },
        { text: '已激活', value: 'active' },
        { text: '已禁用', value: 'disabled' },
      ],
      onFilter: (value: unknown, record: Wallet) => record.status === value,
      render: (status: string) => {
        const config = getStatusConfig(status)
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: 'HL 余额',
      key: 'balance',
      width: 130,
      sorter: (a: Wallet, b: Wallet) =>
        toFiniteNumber(a.hyperliquid?.account_value) - toFiniteNumber(b.hyperliquid?.account_value),
      render: (_: unknown, record: Wallet) => formatUSD(record.hyperliquid?.account_value),
    },
    {
      title: 'PnL',
      key: 'pnl',
      width: 140,
      sorter: (a: Wallet, b: Wallet) =>
        toFiniteNumber(a.hyperliquid?.unrealized_pnl) - toFiniteNumber(b.hyperliquid?.unrealized_pnl),
      render: (_: unknown, record: Wallet) => formatPnL(record.hyperliquid?.unrealized_pnl),
    },
    {
      title: 'Predict 状态',
      key: 'predict',
      width: 120,
      render: (_: unknown, record: Wallet) => {
        const registered = record.predict_registered
        const error = record.predict_error
        if (registered === undefined || registered === null) {
          return <Tag>未知</Tag>
        }
        if (registered) {
          return <Tag color="success">已注册</Tag>
        }
        return (
          <Tag color="error" title={error}>未注册</Tag>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 220,
      render: (_: unknown, record: Wallet) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleOpenDeposit(record)}
          >
            存款
          </Button>
          <Button
            type="link"
            size="small"
            icon={<UploadOutlined />}
            onClick={() => handleOpenWithdraw(record)}
          >
            提现
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除钱包「${record.name}」吗？此操作不可恢复。`}
            onConfirm={() => handleDelete(record)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" icon={<DeleteOutlined />} danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Table
        columns={columns}
        dataSource={wallets}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              description="暂无钱包，点击创建"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
      />

      {/* 存款模态框 */}
      {depositWallet && (
        <DepositModal
          visible={depositModalVisible}
          walletAddress={depositWallet.address}
          walletName={depositWallet.name}
          onClose={() => {
            setDepositModalVisible(false)
            setDepositWallet(null)
          }}
          onConfirm={handleConfirmDeposit}
          loading={depositLoading}
        />
      )}

      {/* 提现模态框 */}
      {withdrawWallet && (
        <WithdrawModal
          visible={withdrawModalVisible}
          walletName={withdrawWallet.name}
          walletAddress={withdrawWallet.address}
          withdrawable={toFiniteNumber(withdrawWallet.hyperliquid?.withdrawable)}
          onClose={() => {
            setWithdrawModalVisible(false)
            setWithdrawWallet(null)
          }}
          onConfirm={handleConfirmWithdraw}
          loading={withdrawLoading}
        />
      )}
    </>
  )
}
