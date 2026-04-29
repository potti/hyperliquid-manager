'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Table,
  Typography,
  Tag,
  Button,
  Switch,
  message,
  Space,
  Statistic,
  Alert,
  Descriptions,
} from 'antd'
import {
  ReloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { pmpeApi } from '@/services/pmpe/api'
import type { PointsOrder, PointsFarmStatus, FarmPlan } from '@/services/pmpe/types'

const statusColor: Record<string, string> = {
  PENDING: 'default',
  OPEN: 'processing',
  FILLED: 'blue',
  SELLING: 'orange',
  SOLD: 'green',
  TIMEOUT: 'warning',
  CANCELLED: 'red',
}

const statusLabel: Record<string, string> = {
  PENDING: '待提交',
  OPEN: '已挂单',
  FILLED: '已成交',
  SELLING: '卖出中',
  SOLD: '已卖出',
  TIMEOUT: '超时',
  CANCELLED: '已撤单',
}

export default function PointsFarmDashboard() {
  const [status, setStatus] = useState<PointsFarmStatus | null>(null)
  const [orders, setOrders] = useState<PointsOrder[]>([])
  const [plan, setPlan] = useState<FarmPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [planLoading, setPlanLoading] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const s = await pmpeApi.getPointsStatus()
      setStatus(s)
    } catch {
      setStatus(null)
    }
  }, [])

  const loadOrders = useCallback(async () => {
    try {
      const res = await pmpeApi.listPointsOrders({ limit: 100 })
      setOrders(res.orders ?? [])
    } catch {
      setOrders([])
    }
  }, [])

  const loadPlan = useCallback(async () => {
    setPlanLoading(true)
    try {
      const p = await pmpeApi.getFarmPlan()
      setPlan(p)
    } catch {
      setPlan(null)
    } finally {
      setPlanLoading(false)
    }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadStatus(), loadOrders()])
    setLoading(false)
  }, [loadStatus, loadOrders])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const cycleStats = useMemo(() => {
    const sold = orders.filter((o) => o.status === 'SOLD').length
    const cancelled = orders.filter((o) => o.status === 'CANCELLED' || o.status === 'TIMEOUT').length
    const total = orders.length
    const cancelRate = total > 0 ? cancelled / total : 0
    return { sold, cancelled, total, cancelRate }
  }, [orders])

  const orderColumns: ColumnsType<PointsOrder> = [
    {
      title: '订单ID',
      dataIndex: 'id',
      width: 100,
      ellipsis: true,
      render: (v: string) => v?.slice(0, 12) + '…',
    },
    {
      title: '市场',
      key: 'market',
      ellipsis: true,
      render: (_, r) => r.market_title || r.market_id,
    },
    {
      title: '方向',
      dataIndex: 'side',
      width: 70,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 80,
      render: (v: number) => `${(v * 100).toFixed(1)}¢`,
    },
    {
      title: '数量',
      dataIndex: 'size',
      width: 70,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s: string) => (
        <Tag color={statusColor[s] || 'default'}>{statusLabel[s] || s}</Tag>
      ),
    },
    {
      title: '买单ID',
      dataIndex: 'buy_order_id',
      width: 100,
      ellipsis: true,
      render: (v?: string) => v?.slice(0, 12) + '…' || '—',
    },
    {
      title: '卖单ID',
      dataIndex: 'sell_order_id',
      width: 100,
      ellipsis: true,
      render: (v?: string) => v?.slice(0, 12) + '…' || '—',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      render: (v: number) => new Date(v * 1000).toLocaleString('zh-CN'),
    },
  ]

  const planColumns: ColumnsType<import('@/services/pmpe/types').FarmTarget> = [
    {
      title: '市场',
      key: 'title',
      ellipsis: true,
      render: (_, r) => r.title || r.market_id,
    },
    {
      title: '方向',
      dataIndex: 'side',
      width: 70,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: '限价',
      dataIndex: 'price',
      width: 80,
      render: (v: number) => `${(v * 100).toFixed(1)}¢`,
    },
    {
      title: '数量',
      dataIndex: 'size',
      width: 70,
    },
    {
      title: '评分',
      dataIndex: 'score',
      width: 60,
      render: (v: number) => v.toFixed(0),
    },
    {
      title: '原因',
      dataIndex: 'reason',
      ellipsis: true,
    },
  ]

  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        Predict.fun 积分刷分
      </Typography.Title>

      {status?.paused && (
        <Alert
          type="warning"
          showIcon
          message="系统已暂停"
          description={status.pause_reason || '撤单率过高，自动暂停保护'}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16}>
        <Col xs={12} md={4}>
          <Card>
            <Statistic
              title="活跃订单"
              value={status?.active_orders ?? 0}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card>
            <Statistic
              title="今日成交"
              value={status?.today_filled ?? 0}
              valueStyle={{ color: '#3f8600' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card>
            <Statistic
              title="今日撤单"
              value={status?.today_cancelled ?? 0}
              valueStyle={{ color: '#cf1322' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card>
            <Statistic
              title="撤单率"
              value={(status?.cancel_rate ?? 0) * 100}
              precision={1}
              suffix="%"
              valueStyle={{
                color: (status?.cancel_rate ?? 0) > 0.3 ? '#cf1322' : '#3f8600',
              }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card>
            <Statistic
              title="总敞口"
              value={status?.total_exposure ?? 0}
              precision={2}
              prefix="$"
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card>
            <Statistic
              title="运行状态"
              value={status?.paused ? '已暂停' : '运行中'}
              valueStyle={{
                color: status?.paused ? '#cf1322' : '#3f8600',
              }}
              loading={loading}
              prefix={
                status?.paused ? (
                  <PauseCircleOutlined />
                ) : (
                  <PlayCircleOutlined />
                )
              }
            />
          </Card>
        </Col>
      </Row>

      {status?.last_run_at && (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          上次运行：{new Date(status.last_run_at).toLocaleString('zh-CN')}
        </Typography.Text>
      )}

      {/* 本地周期统计 */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="当前周期统计" size="small">
            <Descriptions column={4} size="small">
              <Descriptions.Item label="总订单数">{cycleStats.total}</Descriptions.Item>
              <Descriptions.Item label="已卖出">{cycleStats.sold}</Descriptions.Item>
              <Descriptions.Item label="已取消/超时">{cycleStats.cancelled}</Descriptions.Item>
              <Descriptions.Item label="周期撤单率">
                {(cycleStats.cancelRate * 100).toFixed(1)}%
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginTop: 16 }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadAll} loading={loading}>
            刷新数据
          </Button>
          <Button onClick={loadPlan} loading={planLoading}>
            获取刷分计划
          </Button>
        </Space>
      </Card>

      {/* 刷分计划 */}
      {plan && (
        <Card title={`刷分计划 (${plan.dry_run ? 'Dry-Run 模拟' : '实盘'})`} style={{ marginTop: 16 }}>
          {plan.targets.length === 0 ? (
            <Typography.Text type="secondary">当前无符合条件的市场</Typography.Text>
          ) : (
            <Table
              rowKey="market_id"
              dataSource={plan.targets}
              columns={planColumns}
              pagination={false}
              size="small"
            />
          )}
        </Card>
      )}

      {/* 活跃订单列表 */}
      <Card title="订单列表" style={{ marginTop: 16 }}>
        <Table<PointsOrder>
          rowKey="id"
          loading={loading}
          dataSource={orders}
          columns={orderColumns}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 900 }}
          locale={{ emptyText: '暂无订单' }}
        />
      </Card>
    </div>
  )
}
