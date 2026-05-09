'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Card,
  Col,
  Row,
  Select,
  Button,
  Table,
  Tag,
  Descriptions,
  Alert,
  Empty,
  Spin,
  Space,
  message,
  Statistic,
} from 'antd'
import {
  ReloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { strategyApi } from '@/services/strategy/api'
import type {
  AccountState,
  StrategySnapshot,
  PositionView,
  OrderView,
} from '@/services/strategy/types'

const statusColor: Record<string, string> = {
  running: 'green',
  idle: 'default',
  stopped: 'orange',
  error: 'red',
}

const positionColumns: ColumnsType<PositionView> = [
  { title: 'Market', dataIndex: 'market_title', key: 'market_title', ellipsis: true },
  { title: 'Market ID', dataIndex: 'market_id', key: 'market_id', width: 90 },
  {
    title: 'Side',
    dataIndex: 'side',
    key: 'side',
    width: 70,
    render: (s: string) => <Tag color={s === 'YES' ? 'blue' : 'red'}>{s}</Tag>,
  },
  {
    title: 'Entry Price',
    dataIndex: 'entry_price',
    key: 'entry_price',
    width: 100,
    render: (v: number) => v?.toFixed(4),
  },
  {
    title: 'Size',
    dataIndex: 'entry_size',
    key: 'entry_size',
    width: 80,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (s: string) => {
      const color = s === 'open' ? 'green' : s === 'closed' ? 'default' : 'orange'
      return <Tag color={color}>{s}</Tag>
    },
  },
  {
    title: 'Hold Duration',
    dataIndex: 'hold_duration',
    key: 'hold_duration',
    width: 120,
  },
  {
    title: 'Exit Price',
    dataIndex: 'exit_price',
    key: 'exit_price',
    width: 100,
    render: (v: number) => (v ? v.toFixed(4) : '-'),
  },
  {
    title: 'Stop Loss',
    dataIndex: 'stop_loss_price',
    key: 'stop_loss_price',
    width: 100,
    render: (v: number) => v?.toFixed(4),
  },
]

const orderColumns: ColumnsType<OrderView> = [
  { title: 'Market', dataIndex: 'market_title', key: 'market_title', ellipsis: true },
  { title: 'Market ID', dataIndex: 'market_id', key: 'market_id', width: 90 },
  {
    title: 'Order ID',
    dataIndex: 'order_id',
    key: 'order_id',
    width: 140,
    ellipsis: true,
  },
  {
    title: 'Side',
    dataIndex: 'side',
    key: 'side',
    width: 70,
    render: (s: string) => <Tag color={s === 'YES' ? 'blue' : 'red'}>{s}</Tag>,
  },
  {
    title: 'Type',
    dataIndex: 'order_type',
    key: 'order_type',
    width: 80,
    render: (t: string) => <Tag>{t}</Tag>,
  },
  {
    title: 'Price',
    dataIndex: 'price',
    key: 'price',
    width: 100,
    render: (v: number) => v?.toFixed(4),
  },
  {
    title: 'Size',
    dataIndex: 'size',
    key: 'size',
    width: 80,
  },
]

export default function StrategiesPage() {
  const [accounts, setAccounts] = useState<AccountState[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [selectedName, setSelectedName] = useState<string | undefined>()
  const [snapshot, setSnapshot] = useState<StrategySnapshot | null>(null)
  const [snapshotLoading, setSnapshotLoading] = useState(false)

  const loadAccounts = useCallback(async () => {
    setAccountsLoading(true)
    try {
      const list = await strategyApi.listAccounts()
      setAccounts(list ?? [])
    } catch {
      message.warning('Failed to load strategy accounts')
      setAccounts([])
    } finally {
      setAccountsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const selectedAccount = accounts.find((a) => a.name === selectedName)

  const loadSnapshot = useCallback(async (name: string) => {
    setSnapshotLoading(true)
    try {
      const snap = await strategyApi.getAccountSnapshot(name)
      setSnapshot(snap)
    } catch {
      setSnapshot(null)
    } finally {
      setSnapshotLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedName && selectedAccount?.status === 'running') {
      loadSnapshot(selectedName)
    } else {
      setSnapshot(null)
    }
  }, [selectedName, selectedAccount?.status, loadSnapshot])

  const handleSelect = (name: string) => {
    setSelectedName(name)
  }

  const handleRefresh = () => {
    if (selectedName) {
      loadAccounts()
      if (selectedAccount?.status === 'running') {
        loadSnapshot(selectedName)
      }
    } else {
      loadAccounts()
    }
  }

  const handleStart = async () => {
    if (!selectedName) return
    try {
      await strategyApi.startAccount(selectedName)
      message.success('Strategy started')
      loadAccounts()
      loadSnapshot(selectedName)
    } catch {
      message.error('Failed to start strategy')
    }
  }

  const handleStop = async () => {
    if (!selectedName) return
    try {
      await strategyApi.stopAccount(selectedName)
      message.success('Strategy stopped')
      loadAccounts()
      setSnapshot(null)
    } catch {
      message.error('Failed to stop strategy')
    }
  }

  if (!accountsLoading && accounts.length === 0) {
    return (
      <Empty
        description="No strategy accounts configured"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button type="primary" onClick={loadAccounts}>
          Refresh
        </Button>
      </Empty>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Select
            placeholder="Select strategy account"
            style={{ width: 260 }}
            loading={accountsLoading}
            value={selectedName}
            onChange={handleSelect}
            options={accounts.map((a) => ({
              label: `${a.name} (${a.strategy})`,
              value: a.name,
            }))}
          />
        </Col>
        <Col>
          <Space>
            {selectedAccount?.status === 'running' ? (
              <Button
                icon={<PauseCircleOutlined />}
                onClick={handleStop}
                danger
              >
                Stop
              </Button>
            ) : selectedAccount ? (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleStart}
              >
                Start
              </Button>
            ) : null}
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Account status bar */}
      {selectedAccount && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={32}>
            <Col>
              <Statistic
                title="Status"
                value={selectedAccount.status}
                valueStyle={{ color: statusColor[selectedAccount.status] === 'green' ? '#52c41a' : undefined }}
              />
            </Col>
            <Col>
              <Statistic title="Strategy" value={selectedAccount.strategy} />
            </Col>
            <Col>
              <Statistic title="Balance" value={selectedAccount.balance} precision={2} prefix="$" />
            </Col>
            <Col>
              <Statistic title="Points" value={selectedAccount.points} precision={1} />
            </Col>
            <Col>
              <Statistic title="Trades" value={selectedAccount.trade_count} />
            </Col>
            <Col>
              <Statistic title="Volume" value={selectedAccount.total_volume} precision={2} />
            </Col>
            {selectedAccount.last_error && (
              <Col span={24}>
                <Alert
                  type="error"
                  message={selectedAccount.last_error}
                  banner
                  style={{ marginTop: 8 }}
                />
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* Snapshot data */}
      {selectedAccount?.status !== 'running' && selectedAccount && (
        <Alert
          type="warning"
          message="Account not running"
          description="Start the strategy to view positions, orders, and scan details."
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {snapshotLoading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      )}

      {!snapshotLoading && snapshot && (
        <>
          {/* Snapshot summary cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Daily PnL"
                  value={snapshot.daily_pnl}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: snapshot.daily_pnl >= 0 ? '#3f8600' : '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Completed Today"
                  value={snapshot.completed_today}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="Active Positions" value={snapshot.positions.length} />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="Open Orders" value={snapshot.active_orders.length} />
              </Card>
            </Col>
          </Row>

          {/* Last scan summary */}
          {snapshot.last_scan && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions size="small" column={3}>
                <Descriptions.Item label="Last Scan">
                  {new Date(snapshot.last_scan.scan_time).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Markets Scanned">
                  {snapshot.last_scan.scanned_markets}
                </Descriptions.Item>
                <Descriptions.Item label="Markets Filtered">
                  {snapshot.last_scan.filtered_markets}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Orchestrator extra info */}
          {snapshot.extra && (
            <Card size="small" title="Orchestrator" style={{ marginBottom: 16 }}>
              <pre style={{ margin: 0, fontSize: 12 }}>
                {JSON.stringify(snapshot.extra, null, 2)}
              </pre>
            </Card>
          )}

          {/* Positions table */}
          <Card
            title={`Positions (${snapshot.positions.length})`}
            style={{ marginBottom: 16 }}
          >
            {snapshot.positions.length === 0 ? (
              <Empty description="No active positions" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                columns={positionColumns}
                dataSource={snapshot.positions.map((p, i) => ({ ...p, key: `${p.market_id}-${p.side}-${i}` }))}
                size="small"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 900 }}
              />
            )}
          </Card>

          {/* Orders table */}
          <Card title={`Orders (${snapshot.active_orders.length})`}>
            {snapshot.active_orders.length === 0 ? (
              <Empty description="No open orders" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                columns={orderColumns}
                dataSource={snapshot.active_orders.map((o, i) => ({ ...o, key: o.order_id || `${o.market_id}-${o.side}-${i}` }))}
                size="small"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 700 }}
              />
            )}
          </Card>
        </>
      )}
    </div>
  )
}
