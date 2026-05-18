'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Popconfirm, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined } from '@ant-design/icons'
import { strategyApi } from '@/services/strategy/api'
import type { EnrichedAccount } from '@/services/strategy/types'

function formatAddress(addr?: string) {
  if (!addr) return '—'
  const a = String(addr)
  if (a.length <= 12) return a
  return `${a.slice(0, 6)}...${a.slice(-4)}`
}

function statusTag(status: string) {
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
  const [rows, setRows] = useState<EnrichedAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [actingName, setActingName] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const accounts = await strategyApi.listAccountsEnriched()
      setRows(accounts || [])
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

  const handleStart = useCallback(async (name: string) => {
    setActingName(name)
    try {
      await strategyApi.startAccount(name)
      message.success(`账户 ${name} 已启动`)
      await load()
    } catch (err: any) {
      message.error(`启动失败：${err.message || err}`)
    } finally {
      setActingName(null)
    }
  }, [load])

  const handleStop = useCallback(async (name: string) => {
    setActingName(name)
    try {
      await strategyApi.stopAccount(name)
      message.success(`账户 ${name} 已停止`)
      await load()
    } catch (err: any) {
      message.error(`停止失败：${err.message || err}`)
    } finally {
      setActingName(null)
    }
  }, [load])

  const columns: ColumnsType<EnrichedAccount> = useMemo(
    () => [
      {
        title: '账户名称',
        dataIndex: 'name',
        width: 160,
        ellipsis: true,
      },
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
        width: 100,
        render: (v: string) => statusTag(v),
      },
      {
        title: '策略名称',
        dataIndex: 'strategy',
        ellipsis: true,
        render: (v: string) => v || '—',
      },
      {
        title: '余额(USDC)',
        dataIndex: 'balance',
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
        dataIndex: 'total_volume',
        align: 'right',
        width: 140,
        render: (v: number) => fmt2(v),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 160,
        render: (_, record) => {
          const s = (record.status || '').toString().toLowerCase()
          const isRunning = s === 'running'
          const isBusy = actingName === record.name
          return (
            <Space>
              {isRunning ? (
                <Popconfirm
                  title="确认停止"
                  description={`确定要停止账户「${record.name}」吗？`}
                  onConfirm={() => handleStop(record.name)}
                  okText="停止"
                  cancelText="取消"
                >
                  <Button size="small" danger loading={isBusy}>
                    停止
                  </Button>
                </Popconfirm>
              ) : (
                <Button
                  size="small"
                  type="primary"
                  loading={isBusy}
                  disabled={s === 'error'}
                  onClick={() => handleStart(record.name)}
                >
                  启动
                </Button>
              )}
            </Space>
          )
        },
      },
    ],
    [actingName, handleStart, handleStop]
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
      <Table<EnrichedAccount>
        rowKey={(r) => r.name || r.address}
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1200 }}
      />
    </Card>
  )
}

