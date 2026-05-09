'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Space, Form, Input, Modal, message, Spin, Typography } from 'antd'
import { PlusOutlined, ReloadOutlined, WalletOutlined } from '@ant-design/icons'
import WalletOverviewCards from '@/components/wallet/WalletOverviewCards'
import WalletListTable from '@/components/wallet/WalletListTable'
import { walletApi, apiClient } from '@/lib/api-client'
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
  total_balance: number
  total_pnl: number
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [walletsLoading, setWalletsLoading] = useState(false)
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [form] = Form.useForm()

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
          total_balance: list.reduce(
            (sum, w) => sum + toFiniteNumber(w.hyperliquid?.account_value),
            0
          ),
          total_pnl: list.reduce(
            (sum, w) => sum + toFiniteNumber(w.hyperliquid?.unrealized_pnl),
            0
          ),
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

  useEffect(() => {
    fetchWallets()
    fetchStats()
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
          </Space>
        }
      >
        <WalletListTable
          wallets={wallets}
          loading={walletsLoading}
          onRefresh={() => {
            fetchWallets()
            fetchStats()
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
    </div>
  )
}
