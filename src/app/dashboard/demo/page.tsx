'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, Table, Button, Space, Tag, Divider } from 'antd'
import { PlusOutlined, DownloadOutlined, SwapOutlined, UploadOutlined } from '@ant-design/icons'
import DashboardLayout from '@/components/DashboardLayout'

// 钱包列表数据
const walletData = [
  {
    key: '1',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    totalAssets: '$125,430.50',
    unrealizedPnl: '+$2,340.20',
    margin: '$45,000.00',
    withdrawable: '$80,430.50',
    balance: '$125,430.50',
  },
  {
    key: '2',
    address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    totalAssets: '$89,250.00',
    unrealizedPnl: '-$1,120.50',
    margin: '$30,000.00',
    withdrawable: '$59,250.00',
    balance: '$89,250.00',
  },
]

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
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  // 钱包列表列配置
  const walletColumns = [
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
      title: '总资产',
      dataIndex: 'totalAssets',
      key: 'totalAssets',
      width: 130,
    },
    {
      title: '未实现盈亏',
      dataIndex: 'unrealizedPnl',
      key: 'unrealizedPnl',
      width: 130,
      render: (text: string) => (
        <span style={{ color: text.includes('+') ? '#52c41a' : '#f5222d' }}>
          {text}
        </span>
      ),
    },
    {
      title: '保证金',
      dataIndex: 'margin',
      key: 'margin',
      width: 130,
    },
    {
      title: '可提现',
      dataIndex: 'withdrawable',
      key: 'withdrawable',
      width: 130,
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 130,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 200,
      render: () => (
        <Space size="small">
          <Button type="link" size="small" icon={<DownloadOutlined />}>
            存款
          </Button>
          <Button type="link" size="small" icon={<SwapOutlined />}>
            转账
          </Button>
          <Button type="link" size="small" icon={<UploadOutlined />}>
            提现
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

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 第一部分：我的钱包列表 */}
        <Card
          title="我的钱包"
          extra={
            <Button type="primary" icon={<PlusOutlined />}>
              创建钱包
            </Button>
          }
        >
          <Table
            columns={walletColumns}
            dataSource={walletData}
            pagination={false}
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* 第二部分：我的跟单 */}
        <Card
          title="我的跟单"
          extra={
            <Button type="primary" icon={<PlusOutlined />}>
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
      </Space>
    </DashboardLayout>
  )
}

