'use client'

import { Modal, Space, Alert, Typography, Button, message, Steps } from 'antd'
import { CopyOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'

const { Paragraph, Text, Title } = Typography

interface DepositModalProps {
  visible: boolean
  walletAddress: string
  walletName: string
  onClose: () => void
  onConfirm: () => void
}

export default function DepositModal({
  visible,
  walletAddress,
  walletName,
  onClose,
  onConfirm,
}: DepositModalProps) {
  // 复制钱包地址
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    message.success('钱包地址已复制到剪贴板')
  }

  // 确认已转账
  const handleConfirmTransfer = () => {
    message.success('已记录您的存款确认，请等待资金到账')
    onConfirm()
  }

  const depositSteps = [
    {
      title: '复制钱包地址',
      description: '点击下方地址复制',
      icon: <CopyOutlined />,
    },
    {
      title: '存入资金',
      description: '在 Arbitrum 网络存入',
      icon: <WarningOutlined />,
    },
    {
      title: '确认转账',
      description: '触发转账并等待到账',
      icon: <CheckCircleOutlined />,
    },
  ]

  return (
    <Modal
      title={
        <div>
          <Title level={4} style={{ margin: 0 }}>
            存款到钱包: {walletName}
          </Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={650}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirmTransfer}>
          确认已转
        </Button>,
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 存款步骤 */}
        <Steps
          current={-1}
          items={depositSteps}
          size="small"
          style={{ marginTop: 20 }}
        />

        {/* 步骤 1: 复制钱包地址 */}
        <div>
          <Text strong style={{ fontSize: 16 }}>
            1、复制您的钱包地址
          </Text>
          <div
            style={{
              marginTop: 12,
              padding: 16,
              background: '#f5f5f5',
              borderRadius: 8,
              cursor: 'pointer',
              border: '2px dashed #d9d9d9',
              transition: 'all 0.3s',
            }}
            onClick={handleCopyAddress}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#1890ff'
              e.currentTarget.style.background = '#e6f7ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d9d9d9'
              e.currentTarget.style.background = '#f5f5f5'
            }}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space>
                <CopyOutlined style={{ color: '#1890ff' }} />
                <Text type="secondary">点击复制地址</Text>
              </Space>
              <Paragraph
                copyable
                style={{
                  fontFamily: 'monospace',
                  fontSize: 14,
                  marginBottom: 0,
                  wordBreak: 'break-all',
                }}
              >
                {walletAddress}
              </Paragraph>
            </Space>
          </div>
        </div>

        {/* 步骤 2: 在 Arbitrum 网络上存入资金 */}
        <div>
          <Text strong style={{ fontSize: 16 }}>
            2、在 Arbitrum 网络上存入 USDC 和 ETH
          </Text>
          <Alert
            message="最低存款要求"
            description={
              <div>
                <Text strong style={{ fontSize: 16, color: '#ff4d4f' }}>
                  最低存款 USDC: 15 USDC
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  请确保您在 Arbitrum One 网络上进行转账
                </Text>
              </div>
            }
            type="info"
            showIcon
            style={{ marginTop: 12 }}
          />
        </div>

        {/* 步骤 3: 警告信息 */}
        <div>
          <Text strong style={{ fontSize: 16 }}>
            3、重要提示
          </Text>
          <Alert
            message="请务必注意"
            description="来自其他网络或低于最低金额的任何存款都将丢失。请确保使用 Arbitrum One 网络，并满足最低存款要求。"
            type="error"
            showIcon
            style={{ marginTop: 12 }}
          />
        </div>

        {/* 步骤 4: 触发转账 */}
        <div>
          <Text strong style={{ fontSize: 16 }}>
            4、点击按钮触发转账
          </Text>
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            在您的钱包应用（如 MetaMask）中完成转账操作后，请点击下方"确认已转"按钮。
          </Paragraph>
        </div>

        {/* 步骤 5: 等待到账 */}
        <div>
          <Text strong style={{ fontSize: 16 }}>
            5、等待资金到账
          </Text>
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            一旦资金到账，您就准备好跟单交易了。通常需要几分钟到几十分钟不等。
          </Paragraph>
        </div>

        {/* 网络信息卡片 */}
        <Alert
          message="网络信息"
          description={
            <Space direction="vertical" size="small">
              <div>
                <Text strong>网络: </Text>
                <Text>Arbitrum One</Text>
              </div>
              <div>
                <Text strong>支持的代币: </Text>
                <Text>USDC, ETH</Text>
              </div>
              <div>
                <Text strong>预计到账时间: </Text>
                <Text>5-30 分钟</Text>
              </div>
            </Space>
          }
          type="warning"
          showIcon
        />
      </Space>
    </Modal>
  )
}

