'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Space, Form, Input, Modal, message, Spin, Typography, Select, InputNumber } from 'antd'
import { PlusOutlined, ReloadOutlined, WalletOutlined, ThunderboltOutlined } from '@ant-design/icons'
import WalletOverviewCards from '@/components/wallet/WalletOverviewCards'
import WalletListTable from '@/components/wallet/WalletListTable'
import { walletApi, apiClient } from '@/lib/api-client'
import { strategyApi } from '@/services/strategy/api'
import { normalizeWalletsHyperliquid, toFiniteNumber } from '@/utils/wallet-hyperliquid'

const { Text } = Typography

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
  predict_deposit_address?: string
  predict_error?: string
  hyperliquid?: {
    account_value: string | number
    unrealized_pnl: string | number
    margin_used: string | number
    withdrawable: string | number
    is_registered: boolean
  }
}

interface WalletStats {
  total_wallets: number
  active_wallets: number
  total_hl_value: number
  total_pnl: number
  predict_registered?: number
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [walletsLoading, setWalletsLoading] = useState(false)
  const [strategies, setStrategies] = useState<any[]>([])
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [form] = Form.useForm()
  const [strategyModalVisible, setStrategyModalVisible] = useState(false)
  const [strategyLoading, setStrategyLoading] = useState(false)
  const [strategyForm] = Form.useForm()

  // 获取策略账户列表（用于显示钱包关联策略）
  const fetchStrategies = useCallback(async () => {
    try {
      const accounts = await strategyApi.listAccounts()
      setStrategies(accounts || [])
    } catch {
      // silently fail, strategies are optional display
    }
  }, [])

  // 获取钱包列表
  const fetchWallets = useCallback(async () => {
    setWalletsLoading(true)
    try {
      const response = await apiClient<{ wallets: Wallet[] }>('/api/v1/wallet/list')
      const list = normalizeWalletsHyperliquid(response.wallets || [])
      setWallets(list)

      // 如果 stats API 不可用，从钱包列表计算统计
      if (!stats) {
        const computed: WalletStats = {
          total_wallets: list.length,
          active_wallets: list.filter((w) => w.status === 'active').length,
          total_hl_value: list.reduce(
            (sum, w) => sum + toFiniteNumber(w.hyperliquid?.account_value),
            0
          ),
          total_pnl: list.reduce(
            (sum, w) => sum + toFiniteNumber(w.hyperliquid?.unrealized_pnl),
            0
          ),
          predict_registered: list.filter((w) => w.predict_registered === true).length,
        }
        setStats(computed)
      }
    } catch (error: any) {
      message.error(`获取钱包列表失败: ${error.message}`)
    } finally {
      setWalletsLoading(false)
    }
  }, [stats])

  // 获取钱包统计
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const data = await walletApi.getStats()
      setStats(data as WalletStats)
    } catch {
      // stats API 可能未实现，从列表数据计算即可
      console.warn('钱包统计 API 未实现，使用列表数据计算')
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // 创建钱包
  const handleCreateWallet = async (values: { name: string }) => {
    setCreateLoading(true)
    try {
      await walletApi.create(values.name)
      message.success('钱包创建成功！')
      setCreateModalVisible(false)
      form.resetFields()
      fetchWallets()
      fetchStats()
    } catch (error: any) {
      message.error(`创建钱包失败: ${error.message}`)
    } finally {
      setCreateLoading(false)
    }
  }

  // 创建策略
  const handleCreateStrategy = async (values: any) => {
    setStrategyLoading(true)
    try {
      await strategyApi.createAccount({
        name: `btc_short_${Date.now()}`,
        wallet_id: values.wallet_id,
        strategy: 'btc_shortterm',
        enabled: true,
        config: {
          max_positions: values.max_positions,
          position_size_pct: values.position_size_pct,
          stop_loss_pct: values.stop_loss_pct,
          take_profit_pct: values.take_profit_pct,
          max_hold_hours: values.max_hold_hours,
        },
      })
      message.success('策略创建成功！')
      setStrategyModalVisible(false)
      strategyForm.resetFields()
      fetchStrategies()
    } catch (error: any) {
      message.error(`创建策略失败: ${error.message}`)
    } finally {
      setStrategyLoading(false)
    }
  }

  useEffect(() => {
    fetchWallets()
    fetchStats()
    fetchStrategies()
  }, [])

  return (
    <div style={{ padding: 24 }}>
      {/* 顶部统计卡片 */}
      <WalletOverviewCards stats={stats} loading={statsLoading} />

      {/* 钱包列表 */}
      <Card
        title={
          <Space>
            <WalletOutlined />
            <span>钱包列表</span>
          </Space>
        }
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchWallets()
                fetchStats()
              }}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建钱包
            </Button>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={() => setStrategyModalVisible(true)}
            >
              创建策略
            </Button>
          </Space>
        }
      >
        <WalletListTable
          wallets={wallets}
          strategies={strategies}
          loading={walletsLoading}
          onRefresh={() => {
            fetchWallets()
            fetchStats()
            fetchStrategies()
          }}
        />
      </Card>

      {/* 创建钱包模态框 */}
      <Modal
        title="创建新钱包"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateWallet}>
          <Form.Item
            label="钱包名称"
            name="name"
            rules={[{ required: true, message: '请输入钱包名称' }]}
          >
            <Input placeholder="例如：主账户、策略1" maxLength={50} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setCreateModalVisible(false)
                  form.resetFields()
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={createLoading}>
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建策略模态框 */}
      <Modal
        title="创建 BTC 预测策略"
        open={strategyModalVisible}
        onCancel={() => {
          setStrategyModalVisible(false)
          strategyForm.resetFields()
        }}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form
          form={strategyForm}
          layout="vertical"
          onFinish={handleCreateStrategy}
          initialValues={{
            max_positions: 3,
            position_size_pct: 2,
            stop_loss_pct: 5,
            take_profit_pct: 10,
            max_hold_hours: 48,
          }}
        >
          <Form.Item
            name="wallet_id"
            label="选择钱包"
            rules={[{ required: true, message: '请选择钱包' }]}
          >
            <Select placeholder="Choose a wallet">
              {wallets.filter((w: Wallet) => w.status === 'active').map((w: Wallet) => (
                <Select.Option key={w.id} value={w.id}>
                  {w.name || w.address?.slice(0, 10)}...
                  — Balance: ${w.account_value != null ? w.account_value : '?'}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Space size="large">
            <Form.Item name="max_positions" label="最大持仓数" rules={[{ required: true }]}>
              <InputNumber min={1} max={10} />
            </Form.Item>
            <Form.Item name="position_size_pct" label="仓位占比 (%)" rules={[{ required: true }]}>
              <InputNumber min={0.5} max={100} step={0.5} />
            </Form.Item>
          </Space>

          <Space size="large">
            <Form.Item name="stop_loss_pct" label="止损 (%)" rules={[{ required: true }]}>
              <InputNumber min={1} max={50} />
            </Form.Item>
            <Form.Item name="take_profit_pct" label="止盈 (%)" rules={[{ required: true }]}>
              <InputNumber min={1} max={200} />
            </Form.Item>
            <Form.Item name="max_hold_hours" label="最大持仓 (小时)" rules={[{ required: true }]}>
              <InputNumber min={1} max={720} />
            </Form.Item>
          </Space>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setStrategyModalVisible(false)
                  strategyForm.resetFields()
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={strategyLoading}>
                创建策略
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
