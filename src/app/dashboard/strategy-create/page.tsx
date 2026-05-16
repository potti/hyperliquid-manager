'use client'

import { useState } from 'react'
import {
  Form,
  Select,
  InputNumber,
  Button,
  Card,
  Space,
  message,
} from 'antd'
import { useRouter } from 'next/navigation'
import { strategyApi } from '@/services/strategy/api'

export default function StrategyCreatePage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      await strategyApi.createAccount({
        name: `btc_pred_${Date.now()}`,
        strategy: 'btc_prediction',
        enabled: true,
        config: {
          max_positions: values.max_positions,
          position_size_pct: values.position_size_pct,
          stop_loss_pct: values.stop_loss_pct,
          take_profit_pct: values.take_profit_pct,
          max_hold_hours: values.max_hold_hours,
        },
      })
      message.success('Strategy created successfully')
      router.push('/prediction-market/strategies')
    } catch (err: any) {
      message.error(err.message || 'Creation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        Create BTC Prediction Strategy
      </h1>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            strategy_type: 'btc_prediction',
            max_positions: 3,
            position_size_pct: 2,
            stop_loss_pct: 5,
            take_profit_pct: 10,
            max_hold_hours: 48,
          }}
        >
          <Form.Item label="Strategy Type">
            <Select disabled value="btc_prediction">
              <Select.Option value="btc_prediction">
                BTC Prediction (Whale + Funding Signals)
              </Select.Option>
            </Select>
          </Form.Item>

          <Space size="large">
            <Form.Item
              name="max_positions"
              label="Max Positions"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={10} />
            </Form.Item>
            <Form.Item
              name="position_size_pct"
              label="Position Size (%)"
              rules={[{ required: true }]}
            >
              <InputNumber min={0.5} max={100} step={0.5} />
            </Form.Item>
          </Space>

          <Space size="large">
            <Form.Item
              name="stop_loss_pct"
              label="Stop Loss (%)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={50} />
            </Form.Item>
            <Form.Item
              name="take_profit_pct"
              label="Take Profit (%)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={200} />
            </Form.Item>
            <Form.Item
              name="max_hold_hours"
              label="Max Hold (hours)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={720} />
            </Form.Item>
          </Space>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create Strategy
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
