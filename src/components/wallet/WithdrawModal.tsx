'use client'

import { useEffect } from 'react'
import {
  Modal,
  Space,
  Alert,
  Typography,
  Button,
  message,
  Form,
  Input,
  InputNumber,
} from 'antd'

const { Text, Title, Paragraph } = Typography

export interface WithdrawModalProps {
  visible: boolean
  walletName: string
  walletAddress: string
  withdrawable: number
  onClose: () => void
  onConfirm: (amount: number, destination: string) => Promise<void>
  loading?: boolean
}

type WithdrawFormValues = {
  amount: number | null
  destination: string
}

function isValidArbitrumAddress(addr: string): boolean {
  const trimmed = (addr || '').trim()
  if (!trimmed.startsWith('0x')) return false
  if (trimmed.length !== 42) return false
  return /^0x[a-fA-F0-9]{40}$/.test(trimmed)
}

export default function WithdrawModal({
  visible,
  walletName,
  walletAddress,
  withdrawable,
  onClose,
  onConfirm,
  loading = false,
}: WithdrawModalProps) {
  const [form] = Form.useForm<WithdrawFormValues>()

  const maxWithdrawable = Number.isFinite(withdrawable) ? Math.max(0, withdrawable) : 0

  useEffect(() => {
    if (!visible) {
      form.resetFields()
    }
  }, [visible, form])

  const handleFillMax = () => {
    form.setFieldsValue({
      amount: maxWithdrawable > 0 ? Number(maxWithdrawable.toFixed(2)) : null,
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const amount = Number(values.amount)
      const destination = (values.destination || '').trim()

      if (!Number.isFinite(amount) || amount <= 0) {
        message.error('请输入有效的提现金额')
        return
      }
      if (amount > maxWithdrawable + 1e-9) {
        message.error('提现金额不能超过可提现余额')
        return
      }
      if (!isValidArbitrumAddress(destination)) {
        message.error('目标地址格式无效：须为 0x 开头的 42 位十六进制地址')
        return
      }

      await onConfirm(amount, destination)
      form.resetFields()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in (e as object)) {
        return
      }
      const msg = e instanceof Error ? e.message : String(e)
      message.error(msg || '提现失败，请重试')
    }
  }

  const amountWatch = Form.useWatch('amount', form)
  const receiveDisplay =
    amountWatch != null && Number.isFinite(Number(amountWatch)) && Number(amountWatch) > 0
      ? Number(amountWatch).toFixed(2)
      : '—'

  return (
    <Modal
      title={
        <div>
          <Title level={4} style={{ margin: 0 }}>
            提现: {walletName}
          </Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={650}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          取消
        </Button>,
        <Button key="confirm" type="primary" onClick={handleSubmit} loading={loading}>
          确认提现
        </Button>,
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message="提现路径说明"
          description="提现将从 Hyperliquid L1 通过桥接发送到 Arbitrum L1 地址"
          type="info"
          showIcon
        />

        <Alert
          message="网络风险"
          description="请确保目标地址是 Arbitrum One 网络的地址，发送到其他网络的资产将丢失！"
          type="error"
          showIcon
        />

        <div
          style={{
            padding: 16,
            background: '#f6ffed',
            borderRadius: 8,
            border: '1px solid #b7eb8f',
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            来源钱包地址（Arbitrum）
          </Text>
          <Paragraph
            copyable
            style={{
              fontFamily: 'monospace',
              fontSize: 13,
              marginBottom: 8,
              marginTop: 4,
              wordBreak: 'break-all',
            }}
          >
            {walletAddress}
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 13 }}>
            可提现余额（USDC）
          </Text>
          <Title level={3} style={{ margin: '4px 0 0', color: '#52c41a' }}>
            {maxWithdrawable.toFixed(2)} USDC
          </Title>
        </div>

        <Form<WithdrawFormValues>
          form={form}
          layout="vertical"
          requiredMark="optional"
          disabled={loading}
        >
          <Form.Item label="提现金额（USDC）" required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="amount"
                noStyle
                rules={[
                  { required: true, message: '请输入提现金额' },
                  {
                    validator: async (_, value) => {
                      const n = Number(value)
                      if (value == null || !Number.isFinite(n)) {
                        throw new Error('请输入有效数字')
                      }
                      if (n <= 0) {
                        throw new Error('金额必须大于 0')
                      }
                      if (n > maxWithdrawable + 1e-9) {
                        throw new Error('不能超过可提现余额')
                      }
                    },
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  max={maxWithdrawable}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="请输入金额"
                />
              </Form.Item>
              <Button type="default" onClick={handleFillMax} disabled={maxWithdrawable <= 0}>
                最大
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            label="目标地址（Arbitrum One）"
            name="destination"
            rules={[
              { required: true, message: '请输入目标地址' },
              {
                validator: async (_, value) => {
                  const v = (value || '').trim()
                  if (!isValidArbitrumAddress(v)) {
                    throw new Error('地址须以 0x 开头且长度为 42 位（含 0x）')
                  }
                },
              },
            ]}
          >
            <Input placeholder="0x 开头的 Arbitrum One 地址" autoComplete="off" />
          </Form.Item>

          <div style={{ marginBottom: 8 }}>
            <Text strong>预计到账金额（USDC）</Text>
            <Paragraph style={{ margin: '8px 0 0', fontSize: 16 }}>
              {receiveDisplay === '—' ? '—' : `${receiveDisplay}（与提现金额一致）`}
            </Paragraph>
          </div>
        </Form>

        <Alert
          message="网络信息"
          description={
            <Space direction="vertical" size="small">
              <div>
                <Text strong>网络: </Text>
                <Text>Arbitrum One</Text>
              </div>
              <div>
                <Text strong>预计到账: </Text>
                <Text>5-30 分钟</Text>
              </div>
            </Space>
          }
          type="info"
          showIcon
        />

        <Alert
          message="提交前请再次确认"
          description="请仔细核对目标地址与金额。错误地址将导致资产不可恢复。"
          type="warning"
          showIcon
        />
      </Space>
    </Modal>
  )
}
