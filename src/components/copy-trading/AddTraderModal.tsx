'use client'

import { Modal, Form, Input } from 'antd'

interface AddTraderModalProps {
  visible: boolean
  loading: boolean
  onConfirm: (address: string) => void
  onCancel: () => void
}

export default function AddTraderModal({
  visible,
  loading,
  onConfirm,
  onCancel,
}: AddTraderModalProps) {
  const [form] = Form.useForm()

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onConfirm(values.address)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="添加跟单交易员"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="查询"
      cancelText="取消"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 20 }}
      >
        <Form.Item
          label="交易员地址"
          name="address"
          rules={[
            { required: true, message: '请输入交易员地址' },
            { min: 10, message: '地址长度至少为 10 个字符' },
          ]}
        >
          <Input
            placeholder="请输入交易员的钱包地址，例如：0x1234..."
            size="large"
            maxLength={100}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

