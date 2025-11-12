'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Radio,
  Space,
  Divider,
  Alert,
  Select,
  Typography,
  Row,
  Col,
} from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { TraderInfo } from './TraderInfoModal'

const { Text } = Typography
const { Option } = Select

interface SubscribeModalProps {
  visible: boolean
  traderInfo: TraderInfo | null
  wallets: Array<{ id: string; name: string; address: string; status: string }>
  loading: boolean
  onConfirm: (values: SubscribeFormValues) => void
  onCancel: () => void
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

export default function SubscribeModal({
  visible,
  traderInfo,
  wallets,
  loading,
  onConfirm,
  onCancel,
}: SubscribeModalProps) {
  const [form] = Form.useForm<SubscribeFormValues>()
  const [amountType, setAmountType] = useState<'ratio' | 'fixed'>('ratio')

  useEffect(() => {
    if (visible) {
      // 重置表单并设置默认值
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
    }
  }, [visible, form])

  const handleAmountTypeChange = (value: 'ratio' | 'fixed') => {
    setAmountType(value)
    form.setFieldsValue({
      amount_type: value,
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

  // 过滤出激活状态的钱包
  const activeWallets = wallets.filter((w) => w.status === 'active')

  return (
    <Modal
      title="创建跟单"
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={900}
      okText="确认创建"
      cancelText="取消"
      destroyOnClose
    >
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
          <Select placeholder="请选择用于跟单的钱包">
            {activeWallets.map((wallet) => (
              <Option key={wallet.id} value={wallet.address}>
                {wallet.name} ({wallet.address.slice(0, 6)}...{wallet.address.slice(-4)})
              </Option>
            ))}
          </Select>
        </Form.Item>

        {activeWallets.length === 0 && (
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

        {/* 开关选项 */}
        <Form.Item label="跟单策略">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Form.Item name="enable_add_position" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch checkedChildren="加仓开单" unCheckedChildren="加仓开单" />
            </Form.Item>
            <Form.Item name="follow_add_position" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch checkedChildren="跟随加仓" unCheckedChildren="跟随加仓" />
            </Form.Item>
            <Form.Item name="follow_reduce_position" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch checkedChildren="跟随减仓" unCheckedChildren="跟随减仓" />
            </Form.Item>
            <Form.Item name="copy_position" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch checkedChildren="复制仓位" unCheckedChildren="复制仓位" />
            </Form.Item>
            <Form.Item name="reverse_follow" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch checkedChildren="反向跟单" unCheckedChildren="反向跟单" />
            </Form.Item>
          </Space>
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

        {/* 跟单模式 */}
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
          <Radio.Group>
            <Radio value="margin">保证金模式</Radio>
            <Radio value="cross">全仓模式</Radio>
            <Radio value="isolated">逐仓模式</Radio>
          </Radio.Group>
        </Form.Item>

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

        {/* 交易员信息提示 */}
        {traderInfo && (
          <Alert
            message={`将跟单交易员：${traderInfo.address.slice(0, 6)}...${traderInfo.address.slice(-4)}`}
            description={`总资产: $${parseFloat(traderInfo.account_value || '0').toFixed(2)} | 未实现盈亏: $${parseFloat(traderInfo.unrealized_pnl || '0').toFixed(2)}`}
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Form>
    </Modal>
  )
}

