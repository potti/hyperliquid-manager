'use client'

import { Modal, Space, Alert, Typography, Button, Input, InputNumber, message } from 'antd'
import { UploadOutlined, WarningOutlined, InfoCircleOutlined, SwapOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { apiClient } from '@/lib/api-client'

const { Paragraph, Text, Title } = Typography

interface WithdrawModalProps {
  visible: boolean
  wallet: {
    id: string
    name: string
    address: string
    hyperliquid?: {
      withdrawable: string | number
    }
  }
  onClose: () => void
  onSuccess: () => void
}

interface WithdrawResult {
  success: boolean
  message: string
  tx_hash?: string
  amount: string
  destination: string
  chain: string
  source: string
  bridge_address?: string
}

const validAddrRegex = /^0x[0-9a-fA-F]{40}$/

export default function WithdrawModal({
  visible,
  wallet,
  onClose,
  onSuccess,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState<number | null>(null)
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<WithdrawResult | null>(null)

  const withdrawable = Number(wallet.hyperliquid?.withdrawable) || 0

  const handleWithdraw = async () => {
    if (!amount || amount <= 0) {
      message.warning('请输入有效的提现金额')
      return
    }
    if (!destination || !validAddrRegex.test(destination)) {
      message.warning('请输入有效的 Arbitrum 目标地址 (0x...)')
      return
    }
    if (amount > withdrawable) {
      message.warning(`提现金额不能超过可提现余额 ${withdrawable.toFixed(2)} USDC`)
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const response = await apiClient<{
        result: WithdrawResult
        important_info: {
          chain: string
          currency: string
          bridge_address: string
          warning: string
        }
      }>(`/api/v1/wallet/${wallet.id}/withdraw`, {
        method: 'POST',
        body: JSON.stringify({ amount, destination }),
      })

      setResult(response.result)

      if (response.result?.success) {
        message.success(response.result.message)
        onSuccess()
      } else if (response.result) {
        message.warning(response.result.message)
      }
    } catch (error: any) {
      message.error(`提现请求失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setAmount(null)
    setDestination('')
    setResult(null)
    onClose()
  }

  return (
    <Modal
      title={
        <div>
          <Title level={4} style={{ margin: 0 }}>
            提现 - {wallet.name}
          </Title>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={650}
      destroyOnClose
      footer={
        result?.success ? (
          <Button key="close" type="primary" onClick={handleClose}>
            关闭
          </Button>
        ) : [
          <Button key="cancel" onClick={handleClose} disabled={loading}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            icon={<UploadOutlined />}
            onClick={handleWithdraw}
            loading={loading}
            danger
          >
            确认提现
          </Button>,
        ]
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 链信息 - 重要提示 */}
        <Alert
          message="提现链信息"
          description={
            <Space direction="vertical" size="small">
              <div>
                <Text strong>链网络: </Text>
                <Text>Arbitrum One</Text>
              </div>
              <div>
                <Text strong>币种: </Text>
                <Text>USDC</Text>
              </div>
              <div>
                <Text strong>桥合约: </Text>
                <Text code copyable style={{ fontSize: 12 }}>
                  0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7
                </Text>
              </div>
            </Space>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />

        {/* 来源钱包信息 */}
        <div>
          <Text strong style={{ fontSize: 16 }}>
            提现来源
          </Text>
          <div
            style={{
              marginTop: 8,
              padding: 12,
              background: '#f5f5f5',
              borderRadius: 8,
            }}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">钱包名称: </Text>
                <Text strong>{wallet.name}</Text>
              </div>
              <div>
                <Text type="secondary">钱包地址: </Text>
                <Paragraph
                  copyable
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 13,
                    marginBottom: 0,
                    display: 'inline',
                  }}
                >
                  {wallet.address}
                </Paragraph>
              </div>
              <div>
                <Text type="secondary">可提现余额: </Text>
                <Text strong style={{ color: withdrawable > 0 ? '#52c41a' : '#999' }}>
                  {withdrawable.toFixed(2)} USDC
                </Text>
              </div>
            </Space>
          </div>
        </div>

        {/* 提现金额 */}
        <div>
          <Text strong style={{ fontSize: 16 }}>
            提现金额 (USDC)
          </Text>
          <InputNumber
            style={{ width: '100%', marginTop: 8 }}
            placeholder="请输入提现金额"
            min={0}
            max={withdrawable}
            precision={2}
            value={amount}
            onChange={(val) => setAmount(val)}
            size="large"
            addonAfter="USDC"
          />
          <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
            可提现: {withdrawable.toFixed(2)} USDC
          </Text>
        </div>

        {/* 目标地址 */}
        <div>
          <Text strong style={{ fontSize: 16 }}>
            提现目标地址 (Arbitrum One)
          </Text>
          <Input
            style={{ marginTop: 8 }}
            placeholder="请输入 Arbitrum One 网络上的接收地址 (0x...)"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            size="large"
          />
          <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
            必须是 Arbitrum One 网络上的有效地址，以 0x 开头，共 42 个字符
          </Text>
        </div>

        {/* 警告 */}
        <Alert
          message="重要提示"
          description={
            <Space direction="vertical" size="small">
              <Text>
                ⚠️ 请仔细核对目标地址，确保是 <Text strong>Arbitrum One</Text> 网络上的地址。
              </Text>
              <Text>
                ⚠️ 提现操作<Text strong>不可撤销</Text>，资金将发送到您输入的地址，无法追回。
              </Text>
              <Text>
                ⚠️ 提现通过 Hyperliquid 桥处理，通常需要 5-30 分钟到账。
              </Text>
            </Space>
          }
          type="error"
          showIcon
          icon={<WarningOutlined />}
        />

        {/* 提现结果 */}
        {result && (
          <Alert
            message={result.success ? '提现已提交' : '提现失败'}
            description={
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  <Text strong>状态: </Text>
                  <Text>{result.message}</Text>
                </div>
                {result.tx_hash && (
                  <div>
                    <Text strong>交易哈希: </Text>
                    <Text code copyable style={{ fontSize: 12 }}>
                      {result.tx_hash}
                    </Text>
                  </div>
                )}
                <div>
                  <Text strong>金额: </Text>
                  <Text>{result.amount}</Text>
                </div>
                <div>
                  <Text strong>链: </Text>
                  <Text>{result.chain}</Text>
                </div>
                <div>
                  <Text strong>目标地址: </Text>
                  <Text code copyable style={{ fontSize: 12 }}>
                    {result.destination}
                  </Text>
                </div>
              </Space>
            }
            type={result.success ? 'success' : 'error'}
            showIcon
          />
        )}
      </Space>
    </Modal>
  )
}
