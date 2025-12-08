'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Space,
  Alert,
  Typography,
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Radio,
  Divider,
  Select,
  Row,
  Col,
  Button,
} from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { apiClient } from '@/lib/api-client'

const { Text } = Typography
const { Option } = Select

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

// 钱包类型
interface Wallet {
  id: string
  name: string
  address: string
  status: string
}

export interface SubscribeFormValues {
  name: string
  wallet_address: string
  amount_type: 'ratio' | 'fixed'
  // 定比模式参数
  follow_coefficient?: number
  max_leverage?: number
  max_amount?: number
  min_amount?: number
  // 定额模式参数
  follow_amount?: number
  // 止盈止损
  take_profit_pct?: number
  stop_loss_pct?: number
  // 开关选项
  enable_add_position: boolean
  follow_add_position: boolean
  follow_reduce_position: boolean
  copy_position: boolean
  reverse_follow: boolean
  // 跟单模式
  margin_mode: 'margin' | 'cross' | 'isolated'
  // 代币黑白名单
  token_whitelist: string[]
  token_blacklist: string[]
}

// 跟单订阅类型（用于编辑模式）
export interface CopyTradeSubscription {
  id: string
  user_uuid: string
  name: string
  trader_address: string
  wallet_address: string
  amount_type: 'ratio' | 'fixed'
  follow_coefficient?: number
  max_leverage?: number
  max_amount?: number
  min_amount?: number
  follow_amount?: number
  take_profit_pct?: number
  stop_loss_pct?: number
  enable_add_position: boolean
  follow_add_position: boolean
  follow_reduce_position: boolean
  copy_position: boolean
  reverse_follow: boolean
  margin_mode: 'margin' | 'cross' | 'isolated'
  token_whitelist?: string[]
  token_blacklist?: string[]
  status: 'active' | 'paused' | 'stopped'
  created_at: number
  updated_at: number
  trader_info?: TraderInfo
}

interface TraderSubscribeModalProps {
  visible: boolean
  traderInfo: TraderInfo | null
  loading: boolean
  onConfirm: (values: SubscribeFormValues) => void
  onCancel: () => void
  // 编辑模式相关
  mode?: 'create' | 'edit'
  subscription?: CopyTradeSubscription | null
}

export default function TraderSubscribeModal({
  visible,
  traderInfo,
  loading,
  onConfirm,
  onCancel,
  mode = 'create',
  subscription = null,
}: TraderSubscribeModalProps) {
  const [form] = Form.useForm<SubscribeFormValues>()
  const [amountType, setAmountType] = useState<'ratio' | 'fixed'>('ratio')
  const [marginMode, setMarginMode] = useState<'margin' | 'cross' | 'isolated'>('cross')
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [walletsLoading, setWalletsLoading] = useState(false)

  // 加载钱包列表
  useEffect(() => {
    if (visible) {
      fetchWallets()
    }
  }, [visible])

  const fetchWallets = async () => {
    setWalletsLoading(true)
    try {
      const response = await apiClient<{ wallets: Wallet[]; total?: number }>('/api/v1/wallet/list')
      console.log('钱包列表响应:', response)
      
      // 处理响应数据
      let walletList: Wallet[] = []
      if (response && typeof response === 'object') {
        if (Array.isArray(response.wallets)) {
          walletList = response.wallets
        } else if (Array.isArray(response)) {
          walletList = response
        }
      }
      
      console.log('解析后的钱包列表:', walletList)
      setWallets(walletList)
    } catch (error: any) {
      console.error('获取钱包列表失败:', error)
      setWallets([])
    } finally {
      setWalletsLoading(false)
    }
  }

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && subscription) {
        // 编辑模式：填充现有数据
        form.resetFields()
        const formValues: SubscribeFormValues = {
          name: subscription.name,
          wallet_address: subscription.wallet_address,
          amount_type: subscription.amount_type,
          enable_add_position: subscription.enable_add_position,
          follow_add_position: subscription.follow_add_position,
          follow_reduce_position: subscription.follow_reduce_position,
          copy_position: subscription.copy_position,
          reverse_follow: subscription.reverse_follow,
          margin_mode: subscription.margin_mode,
          token_whitelist: subscription.token_whitelist || [],
          token_blacklist: subscription.token_blacklist || [],
        }
        
        // 根据金额类型填充相应参数
        if (subscription.amount_type === 'ratio') {
          if (subscription.follow_coefficient !== undefined) {
            formValues.follow_coefficient = subscription.follow_coefficient
          }
          if (subscription.max_leverage !== undefined) {
            formValues.max_leverage = subscription.max_leverage
          }
          if (subscription.max_amount !== undefined) {
            formValues.max_amount = subscription.max_amount
          }
          if (subscription.min_amount !== undefined) {
            formValues.min_amount = subscription.min_amount
          }
        } else if (subscription.amount_type === 'fixed') {
          if (subscription.follow_amount !== undefined) {
            formValues.follow_amount = subscription.follow_amount
          }
        }
        
        // 止盈止损
        if (subscription.take_profit_pct !== undefined) {
          formValues.take_profit_pct = subscription.take_profit_pct
        }
        if (subscription.stop_loss_pct !== undefined) {
          formValues.stop_loss_pct = subscription.stop_loss_pct
        }
        
        form.setFieldsValue(formValues)
        setAmountType(subscription.amount_type)
        setMarginMode(subscription.margin_mode)
      } else if (traderInfo) {
        // 创建模式：设置默认值
        form.resetFields()
        form.setFieldsValue({
          amount_type: 'ratio',
          enable_add_position: true,
          follow_add_position: true,
          follow_reduce_position: false,
          copy_position: false,
          reverse_follow: false,
          margin_mode: 'cross',
          follow_coefficient: 100,
          min_amount: 5,
          token_whitelist: [],
          token_blacklist: [],
        })
        setAmountType('ratio')
        setMarginMode('cross')
      }
    }
  }, [visible, traderInfo, mode, subscription, form])

  const handleAmountTypeChange = (value: 'ratio' | 'fixed') => {
    setAmountType(value)
    form.setFieldsValue({
      amount_type: value,
    })
  }

  const handleMarginModeChange = (value: 'margin' | 'cross' | 'isolated') => {
    setMarginMode(value)
    form.setFieldsValue({
      margin_mode: value,
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      onConfirm(values)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 编辑模式下，如果没有 traderInfo，尝试从 subscription 中获取
  const displayTraderInfo = traderInfo || subscription?.trader_info || null
  
  if (mode === 'create' && !traderInfo) return null
  if (mode === 'edit' && !subscription) return null

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
      render: (text: string) => {
        const num = parseFloat(text)
        if (isNaN(num)) return '--'
        const color = num >= 0 ? '#52c41a' : '#ff4d4f'
        return <span style={{ color, fontWeight: 500 }}>{num >= 0 ? '+' : ''}{num.toFixed(2)}%</span>
      },
    },
  ]

  // 过滤出激活状态的钱包
  const activeWallets = wallets.filter((w) => w.status === 'active')

  return (
    <Modal
      title={
        <Space>
          <span>{mode === 'edit' ? '编辑跟单' : '交易员信息与创建跟单'}</span>
          {traderInfo?.is_registered ? (
            <Tag icon={<CheckCircleOutlined />} color="success">已注册</Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="default">未注册</Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={1200}
      footer={
        traderInfo?.is_registered
          ? [
              <Button key="cancel" onClick={onCancel}>
                取消
              </Button>,
              <Button
                key="submit"
                type="primary"
                onClick={handleSubmit}
                loading={loading}
              >
                {mode === 'edit' ? '更新跟单' : '创建跟单'}
              </Button>,
            ]
          : [
              <Button key="close" onClick={onCancel}>
                关闭
              </Button>,
            ]
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 交易员信息部分 */}
        <div>
          {/* 地址信息 */}
          <Alert
            message={
              <Space direction="vertical" size={0}>
                <Text type="secondary">交易员地址</Text>
                <Text copyable style={{ fontFamily: 'monospace', fontSize: 14 }}>
                  {displayTraderInfo?.address || subscription?.trader_address || ''}
                </Text>
              </Space>
            }
            type="info"
            style={{ marginBottom: 12 }}
          />

          {displayTraderInfo && !displayTraderInfo.is_registered && (
            <Alert
              message="该地址未在 Hyperliquid 注册"
              description="此交易员尚未在 Hyperliquid 平台注册，无法进行跟单操作。"
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
            />
          )}

          {/* 资金概览 */}
          {displayTraderInfo && displayTraderInfo.is_registered && (
            <Card title="资金概览" size="small" style={{ marginBottom: 12 }}>
              <Space size="large" style={{ width: '100%', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>总资产</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                    {formatUSD(displayTraderInfo.account_value)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>未实现盈亏</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                    {formatUSD(displayTraderInfo.unrealized_pnl)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>已用保证金</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                    {formatUSD(displayTraderInfo.margin_used)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>可提现</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                    {formatUSD(displayTraderInfo.withdrawable)}
                  </div>
                </div>
              </Space>
            </Card>
          )}

          {/* 仓位汇总 */}
          {displayTraderInfo && displayTraderInfo.is_registered && (
            <Card title="仓位汇总" size="small" style={{ marginBottom: 12 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="总仓位价值">
                  {formatUSD(displayTraderInfo.position_summary.total_position_value)}
                </Descriptions.Item>
                <Descriptions.Item label="仓位数量">
                  {displayTraderInfo.position_summary.position_count}
                </Descriptions.Item>
                <Descriptions.Item label="多头仓位">
                  <Tag color="green">{displayTraderInfo.position_summary.long_position_count}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="空头仓位">
                  <Tag color="red">{displayTraderInfo.position_summary.short_position_count}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="总未实现盈亏" span={2}>
                  {formatUSD(displayTraderInfo.position_summary.total_unrealized_pnl)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* 当前仓位 */}
          {displayTraderInfo && displayTraderInfo.is_registered && displayTraderInfo.positions && displayTraderInfo.positions.length > 0 && (
            <Card title={`当前仓位 (${displayTraderInfo.positions.length})`} size="small" style={{ marginBottom: 12 }}>
              <Table
                columns={positionColumns}
                dataSource={displayTraderInfo.positions}
                rowKey="coin"
                pagination={false}
                scroll={{ x: 1200 }}
                size="small"
              />
            </Card>
          )}

          {displayTraderInfo && displayTraderInfo.is_registered && (!displayTraderInfo.positions || displayTraderInfo.positions.length === 0) && (
            <Alert
              message="当前无持仓"
              description="该交易员目前没有任何持仓。"
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
            />
          )}
        </div>

        {/* 创建/编辑跟单部分 */}
        {(displayTraderInfo?.is_registered || mode === 'edit') && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                amount_type: 'ratio',
                enable_add_position: true,
                follow_add_position: true,
                follow_reduce_position: false,
                copy_position: false,
                reverse_follow: false,
                margin_mode: 'cross',
                follow_coefficient: 100,
                min_amount: 5,
              }}
            >
              {/* 基本信息 */}
              <Form.Item
                label="跟单名称"
                name="name"
                rules={[
                  { required: true, message: '请输入跟单名称' },
                  { max: 100, message: '跟单名称长度不能超过100个字符' },
                ]}
              >
                <Input placeholder="例如：BTC跟单策略-001" />
              </Form.Item>

              <Form.Item
                label="交易钱包"
                name="wallet_address"
                rules={[{ required: true, message: '请选择交易钱包' }]}
              >
                <Select
                  placeholder="请选择用于跟单的钱包"
                  loading={walletsLoading}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {activeWallets.map((wallet) => (
                    <Option key={wallet.id} value={wallet.address}>
                      {wallet.name} ({wallet.address})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {activeWallets.length === 0 && !walletsLoading && (
                <Alert
                  message="没有可用的钱包"
                  description="请先创建并激活至少一个钱包"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Divider />

              {/* 跟单金额类型 */}
              <Form.Item
                label="跟单金额类型"
                name="amount_type"
                rules={[{ required: true }]}
              >
                <Radio.Group onChange={(e) => handleAmountTypeChange(e.target.value)}>
                  <Radio value="ratio">定比</Radio>
                  <Radio value="fixed">定额</Radio>
                </Radio.Group>
              </Form.Item>

              {/* 定比模式参数 */}
              {amountType === 'ratio' && (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={
                          <Space>
                            <span>跟单系数 %</span>
                            <InfoCircleOutlined style={{ color: '#999' }} />
                          </Space>
                        }
                        name="follow_coefficient"
                        rules={[
                          { required: true, message: '请输入跟单系数' },
                          { type: 'number', min: 0, max: 100, message: '跟单系数必须在 0-100 之间' },
                        ]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          max={100}
                          precision={2}
                          placeholder="0-100"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={
                          <Space>
                            <span>最大杠杆(可选)</span>
                            <InfoCircleOutlined style={{ color: '#999' }} />
                          </Space>
                        }
                        name="max_leverage"
                        rules={[{ type: 'number', min: 1, message: '最大杠杆必须大于等于 1' }]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={1}
                          placeholder="可选"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="最大金额 $"
                        name="max_amount"
                        rules={[{ type: 'number', min: 0, message: '最大金额不能为负数' }]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          precision={2}
                          placeholder="可选"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="最小金额 $"
                        name="min_amount"
                        rules={[
                          { required: true, message: '请输入最小金额' },
                          { type: 'number', min: 0, message: '最小金额不能为负数' },
                        ]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          precision={2}
                          placeholder="例如：5"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}

              {/* 定额模式参数 */}
              {amountType === 'fixed' && (
                <Form.Item
                  label="跟单金额 $"
                  name="follow_amount"
                  rules={[
                    { required: true, message: '请输入跟单金额' },
                    { type: 'number', min: 0.01, message: '跟单金额必须大于 0' },
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0.01}
                    precision={2}
                    placeholder="请输入跟单金额"
                  />
                </Form.Item>
              )}

              <Divider />

              {/* 开关选项 - 并排显示 */}
              <Form.Item label="跟单策略">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="enable_add_position" valuePropName="checked" style={{ marginBottom: 0 }}>
                      <Switch checkedChildren="加仓开单" unCheckedChildren="加仓开单" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="follow_add_position" valuePropName="checked" style={{ marginBottom: 0 }}>
                      <Switch checkedChildren="跟随加仓" unCheckedChildren="跟随加仓" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col span={12}>
                    <Form.Item name="follow_reduce_position" valuePropName="checked" style={{ marginBottom: 0 }}>
                      <Switch checkedChildren="跟随减仓" unCheckedChildren="跟随减仓" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="copy_position" valuePropName="checked" style={{ marginBottom: 0 }}>
                      <Switch checkedChildren="复制仓位" unCheckedChildren="复制仓位" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col span={12}>
                    <Form.Item name="reverse_follow" valuePropName="checked" style={{ marginBottom: 0 }}>
                      <Switch checkedChildren="反向跟单" unCheckedChildren="反向跟单" />
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>

              <Divider />

              {/* 止盈止损 */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="止盈点 % (0-2000)"
                    name="take_profit_pct"
                    rules={[
                      { type: 'number', min: 0, max: 2000, message: '止盈点必须在 0-2000 之间' },
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={2000}
                      precision={2}
                      placeholder="可选"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="止损点 % (0-95)"
                    name="stop_loss_pct"
                    rules={[
                      { type: 'number', min: 0, max: 95, message: '止损点必须在 0-95 之间' },
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={95}
                      precision={2}
                      placeholder="可选"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              {/* 跟单模式 - 动态显示相关属性 */}
              <Form.Item
                label={
                  <Space>
                    <span>跟单模式</span>
                    <InfoCircleOutlined style={{ color: '#999' }} />
                  </Space>
                }
                name="margin_mode"
                rules={[{ required: true, message: '请选择跟单模式' }]}
              >
                <Radio.Group onChange={(e) => handleMarginModeChange(e.target.value)}>
                  <Radio value="margin">保证金模式</Radio>
                  <Radio value="cross">全仓模式</Radio>
                  <Radio value="isolated">逐仓模式</Radio>
                </Radio.Group>
              </Form.Item>

              {/* 根据跟单模式动态显示相关属性 */}
              {marginMode === 'margin' && (
                <Alert
                  message="保证金模式"
                  description="使用账户保证金进行交易，风险相对较低。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              {marginMode === 'cross' && (
                <Alert
                  message="全仓模式"
                  description="使用全部账户余额作为保证金，可以最大化资金利用率。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              {marginMode === 'isolated' && (
                <Alert
                  message="逐仓模式"
                  description="每个仓位独立计算保证金，单个仓位亏损不会影响其他仓位。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Divider />

              {/* 代币黑白名单 */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="代币白名单"
                    name="token_whitelist"
                    tooltip="只跟单白名单中的代币，留空表示不限制"
                  >
                    <Select
                      mode="tags"
                      placeholder="输入代币名称，如 BTC、ETH"
                      tokenSeparators={[',']}
                      style={{ width: '100%' }}
                    >
                      <Option value="BTC">BTC</Option>
                      <Option value="ETH">ETH</Option>
                      <Option value="SOL">SOL</Option>
                      <Option value="USDC">USDC</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="代币黑名单"
                    name="token_blacklist"
                    tooltip="不跟单黑名单中的代币"
                  >
                    <Select
                      mode="tags"
                      placeholder="输入代币名称，如 DOGE"
                      tokenSeparators={[',']}
                      style={{ width: '100%' }}
                    >
                      <Option value="DOGE">DOGE</Option>
                      <Option value="SHIB">SHIB</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </>
        )}
      </Space>
    </Modal>
  )
}

