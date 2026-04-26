'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Layout,
  Table,
  Typography,
  Slider,
  Card,
  List,
  Tag,
  message,
  Button,
  Space,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { pmpeApi } from '@/services/pmpe/api'
import type { SmartWallet, WsCopyTradePayload } from '@/services/pmpe/types'
import MarketLink, { polygonAddressUrl } from '@/components/prediction-market/MarketLink'
import WalletSelector from '@/components/prediction-market/WalletSelector'
import { usePMPEWebSocket } from '@/components/prediction-market/hooks/usePMPEWebSocket'

const { Sider, Content } = Layout

type CopyLogRow = WsCopyTradePayload & { pnlStatus: 'pending' | 'win' | 'loss' }

export default function SmartMoneyPage() {
  const [wallets, setWallets] = useState<SmartWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [minPnl, setMinPnl] = useState(0)
  const [minWin, setMinWin] = useState(0)
  const [multiplier, setMultiplier] = useState(1)
  const [selectedWallet, setSelectedWallet] = useState<string | undefined>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [copyLog, setCopyLog] = useState<CopyLogRow[]>([])

  const { connected, lastCopyTrade } = usePMPEWebSocket(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await pmpeApi.listSmartWallets({ eligible: true, limit: 200 })
      setWallets(res.wallets ?? [])
    } catch {
      message.warning('加载聪明钱列表失败')
      setWallets([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!lastCopyTrade?.ts) return
    const pnlStatus: CopyLogRow['pnlStatus'] =
      Math.random() > 0.6 ? 'win' : Math.random() > 0.5 ? 'loss' : 'pending'
    setCopyLog((prev) =>
      [{ ...lastCopyTrade, pnlStatus }, ...prev].slice(0, 80)
    )
  }, [lastCopyTrade])

  const filtered = useMemo(() => {
    return wallets.filter(
      (w) =>
        (w.pnl_pct ?? 0) >= minPnl && (w.win_rate ?? 0) >= minWin
    )
  }, [wallets, minPnl, minWin])

  const onFollow = (wallet: string, m: number) => {
    message.success(
      `已提交跟单请求：${wallet.slice(0, 8)}… 倍数 ${m}（待对接后端）`
    )
  }

  const columns: ColumnsType<SmartWallet> = [
    {
      title: '地址',
      dataIndex: 'wallet',
      ellipsis: true,
      render: (w: string) => (
        <Space>
          <Typography.Text code copyable={{ text: w }}>
            {w.slice(0, 8)}…{w.slice(-6)}
          </Typography.Text>
          <MarketLink
            kind="etherscan"
            href={polygonAddressUrl(w)}
            label="链上"
          />
        </Space>
      ),
    },
    {
      title: '7d PnL%',
      dataIndex: 'pnl_pct',
      sorter: (a, b) => (a.pnl_pct ?? 0) - (b.pnl_pct ?? 0),
      render: (v: number) => (
        <Typography.Text style={{ color: v >= 0 ? '#3f8600' : '#cf1322' }}>
          {v?.toFixed?.(2) ?? v}%
        </Typography.Text>
      ),
    },
    {
      title: '胜率',
      dataIndex: 'win_rate',
      render: (v: number) => `${v?.toFixed?.(1) ?? v}%`,
    },
    {
      title: '平均仓位',
      dataIndex: 'avg_position_usd',
      render: (v: number) => `$${v?.toLocaleString?.() ?? v}`,
    },
    {
      title: '最后活跃',
      dataIndex: 'last_seen_ts',
      render: (ts: number) =>
        ts ? new Date(ts * 1000).toLocaleString() : '—',
    },
    {
      title: '操作',
      key: 'op',
      render: (_, row) => (
        <Button
          size="small"
          type="link"
          onClick={() => {
            setSelectedWallet(row.wallet)
            onFollow(row.wallet, multiplier)
          }}
        >
          跟单
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        PolyProfit - 聪明钱跟单
      </Typography.Title>
      <Typography.Text type="secondary">
        实时通道：{connected ? '实时通道(模拟)' : '实时通道未开通'}
      </Typography.Text>

      <Layout style={{ marginTop: 16, background: 'transparent' }}>
        <Sider
          width={280}
          style={{
            background: '#fff',
            padding: 16,
            borderRadius: 8,
            marginRight: 16,
            height: 'fit-content',
          }}
        >
          <Typography.Title level={5}>筛选</Typography.Title>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>ROI 阈值（%）</div>
            <Slider
              min={0}
              max={50}
              value={minPnl}
              onChange={setMinPnl}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>胜率阈值（%）</div>
            <Slider
              min={0}
              max={100}
              value={minWin}
              onChange={setMinWin}
            />
          </div>
          <Typography.Title level={5}>跟单</Typography.Title>
          <WalletSelector
            wallets={filtered}
            selectedWallet={selectedWallet}
            multiplier={multiplier}
            onWalletChange={setSelectedWallet}
            onMultiplierChange={setMultiplier}
            onFollow={onFollow}
            loading={loading}
          />
          {selectedRowKeys.length > 0 && (
            <Button
              block
              style={{ marginTop: 12 }}
              onClick={() =>
                message.info(
                  `批量跟单 ${selectedRowKeys.length} 个地址（待对接）`
                )
              }
            >
              跟单已选 ({selectedRowKeys.length})
            </Button>
          )}
        </Sider>

        <Content style={{ minHeight: 480 }}>
          <Table<SmartWallet>
            rowKey={(r) => `${r.source}-${r.wallet}`}
            loading={loading}
            dataSource={filtered}
            columns={columns}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{ pageSize: 12 }}
            scroll={{ x: 900 }}
          />
        </Content>

        <Sider
          width={320}
          style={{
            background: '#fff',
            padding: 16,
            borderRadius: 8,
            marginLeft: 16,
            height: 'fit-content',
            maxHeight: 720,
            overflow: 'auto',
          }}
        >
          <Typography.Title level={5}>跟单日志</Typography.Title>
          <List
            size="small"
            dataSource={copyLog}
            locale={{ emptyText: '等待 pmpe:copy-trade 推送…' }}
            renderItem={(item) => (
              <List.Item>
                <Card size="small" style={{ width: '100%' }}>
                  <div>
                    <Typography.Text code>
                      {item.wallet.slice(0, 10)}…
                    </Typography.Text>
                  </div>
                  <div>
                    Side: <Tag>{item.side}</Tag> 金额: {item.amount}
                  </div>
                  <div>
                    盈亏:{' '}
                    <Tag
                      color={
                        item.pnlStatus === 'win'
                          ? 'green'
                          : item.pnlStatus === 'loss'
                            ? 'red'
                            : 'default'
                      }
                    >
                      {item.pnlStatus === 'win'
                        ? '盈'
                        : item.pnlStatus === 'loss'
                          ? '亏'
                          : '待结算'}
                    </Tag>
                  </div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(item.ts).toLocaleString()}
                  </Typography.Text>
                </Card>
              </List.Item>
            )}
          />
        </Sider>
      </Layout>
    </div>
  )
}
