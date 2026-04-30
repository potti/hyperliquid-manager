'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined } from '@ant-design/icons'
import { get } from '@/lib/api-client'

type StrategyAccountStatus = 'running' | 'idle' | 'stopped' | 'error' | string

export type StrategyAccountEnriched = {
  address: string
  status: StrategyAccountStatus
  strategy_name?: string
  balance_usdc?: number
  points?: number
  trade_count?: number
  total_volume_usdc?: number
  [key: string]: any
}

type AccountsEnrichedResponse =
  | { accounts: StrategyAccountEnriched[]; total?: number }
  | { data: StrategyAccountEnriched[] }
  | StrategyAccountEnriched[]

function formatAddress(addr?: string) {
  if (!addr) return '—'
  const a = String(addr)
  if (a.length <= 12) return a
  return `${a.slice(0, 6)}...${a.slice(-4)}`
}

function statusTag(status: StrategyAccountStatus) {
  const s = (status || '').toString().toLowerCase()
  const color =
    s === 'running'
      ? 'green'
      : s === 'idle'
        ? 'blue'
        : s === 'stopped'
          ? 'orange'
          : s === 'error'
            ? 'red'
            : 'default'
  return <Tag color={color}>{status || 'unknown'}</Tag>
}

function fmt2(v: any) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(2)
}

export default function StrategyAccountsPage() {
  const [rows, setRows] = useState<StrategyAccountEnriched[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await get<AccountsEnrichedResponse>(
        '/api/v1/strategy/accounts-enriched'
      )

      const accounts: StrategyAccountEnriched[] = Array.isArray(res)
        ? res
        : 'accounts' in (res as any)
          ? ((res as any).accounts ?? [])
          : 'data' in (res as any)
            ? ((res as any).data ?? [])
            : []

      setRows(accounts)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      message.error(`加载策略账户失败：${msg}`)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const columns: ColumnsType<StrategyAccountEnriched> = useMemo(
    () => [
      {
        title: '钱包地址',
        dataIndex: 'address',
        width: 160,
        ellipsis: true,
        render: (v: string) => (
          <Typography.Text code>{formatAddress(v)}</Typography.Text>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 120,
        render: (v: StrategyAccountStatus) => statusTag(v),
      },
      {
        title: '策略名称',
        dataIndex: 'strategy_name',
        ellipsis: true,
        render: (v: string) => v || '—',
      },
      {
        title: '余额(USDC)',
        dataIndex: 'balance_usdc',
        align: 'right',
        width: 140,
        render: (v: number) => fmt2(v),
      },
      {
        title: '积分',
        dataIndex: 'points',
        align: 'right',
        width: 100,
        render: (v: number) => (v ?? '—'),
      },
      {
        title: '交易次数',
        dataIndex: 'trade_count',
        align: 'right',
        width: 110,
        render: (v: number) => (v ?? '—'),
      },
      {
        title: '总交易量',
        dataIndex: 'total_volume_usdc',
        align: 'right',
        width: 140,
        render: (v: number) => fmt2(v),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 140,
        render: (_, record) => {
          const s = (record.status || '').toString().toLowerCase()
          const isRunning = s === 'running'
          return (
            <Space>
              <Button
                size="small"
                type={isRunning ? 'default' : 'primary'}
                danger={isRunning}
                disabled={s === 'error'}
                onClick={() => {
                  message.info('启动/停止接口尚未接入（仅展示 UI）')
                }}
              >
                {isRunning ? '停止' : '启动'}
              </Button>
            </Space>
          )
        },
      },
    ],
    []
  )

  return (
    <Card
      title="策略账户管理"
      extra={
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          刷新
        </Button>
      }
    >
      <Table<StrategyAccountEnriched>
        rowKey={(r) => r.address}
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1100 }}
      />
    </Card>
  )
}

