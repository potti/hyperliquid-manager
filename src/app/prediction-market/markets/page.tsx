'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Table,
  Input,
  Button,
  Tag,
  Space,
  message,
  Typography,
  Drawer,
  Form,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, SyncOutlined } from '@ant-design/icons'
import { pmpeApi } from '@/services/pmpe/api'
import type { MappingHealthResponse, PMMarket } from '@/services/pmpe/types'

const { Search } = Input
const { Title } = Typography

export default function MarketsPage() {
  const [markets, setMarkets] = useState<PMMarket[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [mappingHealth, setMappingHealth] =
    useState<MappingHealthResponse | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMarket, setDrawerMarket] = useState<PMMarket | null>(null)
  const [refreshingKey, setRefreshingKey] = useState<string | null>(null)
  const [form] = Form.useForm<{ poly_slug: string; kalshi_ticker: string }>()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [marketsRes, healthRes] = await Promise.all([
        pmpeApi.listMarkets({ active: true, limit: 500 }),
        pmpeApi.getMappingHealth().catch(() => null),
      ])
      setMarkets(marketsRes.markets ?? [])
      setPagination((p) => ({ ...p, total: marketsRes.count ?? 0 }))
      setMappingHealth(healthRes)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return markets
    return markets.filter((m) =>
      (m.event_title ?? '').toLowerCase().includes(q)
    )
  }, [markets, searchText])

  useEffect(() => {
    setPagination((p) => ({ ...p, current: 1, total: filtered.length }))
  }, [searchText, markets.length, filtered.length])

  const pageData = useMemo(() => {
    const { current, pageSize } = pagination
    const start = (current - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, pagination])

  const openMappingDrawer = (row: PMMarket) => {
    setDrawerMarket(row)
    form.setFieldsValue({
      poly_slug: row.mapping?.poly?.slug ?? '',
      kalshi_ticker: row.mapping?.kalshi?.ticker ?? '',
    })
    setDrawerOpen(true)
  }

  const refreshRow = async (row: PMMarket) => {
    setRefreshingKey(row.event_key)
    try {
      const m = await pmpeApi.getMarket(row.event_key)
      setMarkets((prev) =>
        prev.map((x) => (x.event_key === m.event_key ? m : x))
      )
      message.success('价格已刷新')
    } catch {
      message.error('刷新该市场失败')
    } finally {
      setRefreshingKey(null)
    }
  }

  const mappingTag = (r: PMMarket) => {
    const c = r.mapping?.confidence ?? 0
    if (c >= 0.6) return <Tag color="green">已映射</Tag>
    if (c >= 0.4) return <Tag color="gold">待审核</Tag>
    return <Tag color="red">未映射</Tag>
  }

  const columns: ColumnsType<PMMarket> = [
    {
      title: '事件',
      dataIndex: 'event_title',
      key: 'event_title',
      ellipsis: true,
    },
    {
      title: 'Poly YES',
      key: 'poly_yes',
      render: (_, r) => r.quotes?.poly_yes?.toFixed(4) ?? '—',
    },
    {
      title: 'Poly NO',
      key: 'poly_no',
      render: (_, r) => r.quotes?.poly_no?.toFixed(4) ?? '—',
    },
    {
      title: 'Kalshi YES',
      key: 'kalshi_yes',
      render: (_, r) => r.quotes?.kalshi_yes?.toFixed(4) ?? '—',
    },
    {
      title: 'Kalshi NO',
      key: 'kalshi_no',
      render: (_, r) => r.quotes?.kalshi_no?.toFixed(4) ?? '—',
    },
    {
      title: '流动性',
      key: 'liquidity',
      render: (_, r) => {
        const p = r.liquidity?.poly
        const k = r.liquidity?.kalshi
        if (p == null && k == null) return '—'
        return `P:${(p ?? 0).toFixed(0)} / K:${(k ?? 0).toFixed(0)}`
      },
    },
    {
      title: '结算时间',
      key: 'end',
      width: 170,
      render: (_, r) =>
        r.event_end_ts
          ? new Date(r.event_end_ts * 1000).toLocaleString()
          : '—',
    },
    {
      title: '映射状态',
      key: 'mapping',
      render: (_, r) => mappingTag(r),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_, r) => (
        <Space wrap>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            loading={refreshingKey === r.event_key}
            onClick={() => refreshRow(r)}
          >
            刷新价格
          </Button>
          <Button size="small" type="link" onClick={() => openMappingDrawer(r)}>
            手动映射
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Title level={4} style={{ marginBottom: 16 }}>
        PolyProfit - 市场数据
      </Title>

      <Space style={{ marginBottom: 16 }} wrap>
        <Search
          placeholder="搜索事件..."
          allowClear
          style={{ width: 300 }}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button icon={<SyncOutlined />} onClick={loadData} loading={loading}>
          刷新全部
        </Button>
      </Space>

      {mappingHealth && (
        <Space style={{ marginBottom: 16 }} wrap>
          <Tag color="blue">总市场: {mappingHealth.total_markets}</Tag>
          <Tag color="green">已映射: {mappingHealth.mapped_markets}</Tag>
          <Tag color="gold">待审核: {mappingHealth.needs_review_count}</Tag>
          <Tag
            color={
              mappingHealth.health_status === 'excellent'
                ? 'green'
                : mappingHealth.health_status === 'poor'
                  ? 'red'
                  : 'blue'
            }
          >
            健康度: {mappingHealth.health_status}
          </Tag>
        </Space>
      )}

      <Table<PMMarket>
        columns={columns}
        dataSource={pageData}
        rowKey="event_key"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filtered.length,
          showSizeChanger: true,
          onChange: (c, ps) =>
            setPagination((p) => ({ ...p, current: c, pageSize: ps ?? 20 })),
        }}
        scroll={{ x: 1200 }}
      />

      <Drawer
        title={drawerMarket ? `手动映射 — ${drawerMarket.event_title}` : '手动映射'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={400}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={() => {
            message.success('映射已提交（待后端对接）')
            setDrawerOpen(false)
          }}
        >
          <Form.Item
            name="poly_slug"
            label="Polymarket slug / event"
            rules={[{ required: true, message: '请输入' }]}
          >
            <Input placeholder="例如 event-slug" />
          </Form.Item>
          <Form.Item
            name="kalshi_ticker"
            label="Kalshi ticker"
            rules={[{ required: true, message: '请输入' }]}
          >
            <Input placeholder="例如 KX-..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            提交
          </Button>
        </Form>
      </Drawer>
    </div>
  )
}
