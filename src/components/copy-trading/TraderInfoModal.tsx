'use client'

import { Modal, Descriptions, Table, Tag, Space, Alert, Typography, Card } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

// 交易员仓位类型
interface TraderPosition {
  coin: string
  side: string
  leverage: string
  size: string
  position_value: string
  entry_price: string
  mark_price: string
  liquidation_px: string
  unrealized_pnl: string
  margin_used: string
  return_on_equity: string
}

// 仓位汇总类型
interface PositionSummary {
  total_position_value: string
  position_count: number
  long_position_count: number
  short_position_count: number
  total_unrealized_pnl: string
}

// 交易员信息类型
export interface TraderInfo {
  address: string
  account_value: string
  unrealized_pnl: string
  margin_used: string
  withdrawable: string
  is_registered: boolean
  position_summary: PositionSummary
  positions?: TraderPosition[]
}

interface TraderInfoModalProps {
  visible: boolean
  traderInfo: TraderInfo | null
  onClose: () => void
  onSubscribe?: (traderInfo: TraderInfo) => void
}

export default function TraderInfoModal({
  visible,
  traderInfo,
  onClose,
  onSubscribe,
}: TraderInfoModalProps) {
  if (!traderInfo) return null

  // 格式化美元金额
  const formatUSD = (value: string | undefined) => {
    if (!value || value === '0' || value === '0.00') {
      return <span style={{ color: '#999' }}>$0.00</span>
    }
    const num = parseFloat(value)
    if (isNaN(num)) {
      return <span style={{ color: '#999' }}>--</span>
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

  // 格式化百分比
  const formatPercent = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return '--'
    const color = num >= 0 ? '#52c41a' : '#ff4d4f'
    return <span style={{ color, fontWeight: 500 }}>{num >= 0 ? '+' : ''}{num.toFixed(2)}%</span>
  }

  // 仓位列表列配置
  const positionColumns = [
    {
      title: '币种',
      dataIndex: 'coin',
      key: 'coin',
      width: 100,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '方向',
      dataIndex: 'side',
      key: 'side',
      width: 80,
      render: (side: string) => (
        <Tag color={side === 'long' ? 'green' : 'red'}>
          {side === 'long' ? '做多' : '做空'}
        </Tag>
      ),
    },
    {
      title: '杠杆',
      dataIndex: 'leverage',
      key: 'leverage',
      width: 80,
      render: (text: string) => `${parseFloat(text).toFixed(1)}x`,
    },
    {
      title: '数量',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (text: string) => {
        const num = parseFloat(text)
        return Math.abs(num).toFixed(4)
      },
    },
    {
      title: '仓位价值',
      dataIndex: 'position_value',
      key: 'position_value',
      width: 130,
      render: (text: string) => formatUSD(text),
    },
    {
      title: '开仓价格',
      dataIndex: 'entry_price',
      key: 'entry_price',
      width: 120,
      render: (text: string) => text ? `$${parseFloat(text).toFixed(2)}` : '--',
    },
    {
      title: '强平价格',
      dataIndex: 'liquidation_px',
      key: 'liquidation_px',
      width: 120,
      render: (text: string) => text ? `$${parseFloat(text).toFixed(2)}` : '--',
    },
    {
      title: '未实现盈亏',
      dataIndex: 'unrealized_pnl',
      key: 'unrealized_pnl',
      width: 130,
      render: (text: string) => formatUSD(text),
    },
    {
      title: '保证金',
      dataIndex: 'margin_used',
      key: 'margin_used',
      width: 120,
      render: (text: string) => formatUSD(text),
    },
    {
      title: 'ROE',
      dataIndex: 'return_on_equity',
      key: 'return_on_equity',
      width: 100,
      render: (text: string) => formatPercent(text),
    },
  ]

  return (
    <Modal
      title={
        <Space>
          <span>交易员信息</span>
          {traderInfo.is_registered ? (
            <Tag icon={<CheckCircleOutlined />} color="success">已注册</Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="default">未注册</Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1400}
      footer={[
        <Space key="actions">
          <button
            key="cancel"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            关闭
          </button>
          {traderInfo.is_registered && onSubscribe && (
            <button
              key="subscribe"
              onClick={() => onSubscribe(traderInfo)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              创建跟单
            </button>
          )}
        </Space>
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 地址信息 */}
        <Alert
          message={
            <Space direction="vertical" size={0}>
              <Text type="secondary">交易员地址</Text>
              <Text copyable style={{ fontFamily: 'monospace', fontSize: 14 }}>
                {traderInfo.address}
              </Text>
            </Space>
          }
          type="info"
        />

        {!traderInfo.is_registered && (
          <Alert
            message="该地址未在 Hyperliquid 注册"
            description="此交易员尚未在 Hyperliquid 平台注册，无法进行跟单操作。"
            type="warning"
            showIcon
          />
        )}

        {/* 资金概览 */}
        {traderInfo.is_registered && (
          <Card title="资金概览" size="small">
            <Space size="large" style={{ width: '100%', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>总资产</div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                  {formatUSD(traderInfo.account_value)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>未实现盈亏</div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                  {formatUSD(traderInfo.unrealized_pnl)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>已用保证金</div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                  {formatUSD(traderInfo.margin_used)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>可提现</div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                  {formatUSD(traderInfo.withdrawable)}
                </div>
              </div>
            </Space>
          </Card>
        )}

        {/* 仓位汇总 */}
        {traderInfo.is_registered && (
          <Card title="仓位汇总" size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="总仓位价值">
                {formatUSD(traderInfo.position_summary.total_position_value)}
              </Descriptions.Item>
              <Descriptions.Item label="仓位数量">
                {traderInfo.position_summary.position_count}
              </Descriptions.Item>
              <Descriptions.Item label="多头仓位">
                <Tag color="green">{traderInfo.position_summary.long_position_count}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="空头仓位">
                <Tag color="red">{traderInfo.position_summary.short_position_count}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="总未实现盈亏" span={2}>
                {formatUSD(traderInfo.position_summary.total_unrealized_pnl)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* 当前仓位 */}
        {traderInfo.is_registered && traderInfo.positions && traderInfo.positions.length > 0 && (
          <Card title={`当前仓位 (${traderInfo.positions.length})`} size="small">
            <Table
              columns={positionColumns}
              dataSource={traderInfo.positions}
              rowKey="coin"
              pagination={false}
              scroll={{ x: 1200 }}
              size="small"
            />
          </Card>
        )}

        {traderInfo.is_registered && (!traderInfo.positions || traderInfo.positions.length === 0) && (
          <Alert
            message="当前无持仓"
            description="该交易员目前没有任何持仓。"
            type="info"
            showIcon
          />
        )}
      </Space>
    </Modal>
  )
}

