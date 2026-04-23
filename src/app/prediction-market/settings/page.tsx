'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Form,
  InputNumber,
  Input,
  Switch,
  Button,
  Card,
  Typography,
  Space,
  Slider,
  message,
  Divider,
  Table,
} from 'antd'
import { pmpeApi } from '@/services/pmpe/api'
import type { PMPEConfig } from '@/services/pmpe/types'

const { Title } = Typography

export default function SettingsPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [principal, setPrincipal] = useState(10_000)
  const [statsWinRate, setStatsWinRate] = useState(0.55)
  const [statsAvgPnl, setStatsAvgPnl] = useState(0)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      pmpeApi.getConfig().catch(() => null),
      pmpeApi.getProfitStats().catch(() => null),
    ])
      .then(([cfg, profit]) => {
        if (cfg) {
          form.setFieldsValue(mapConfigToForm(cfg))
        }
        if (profit) {
          setStatsWinRate(
            Number.isFinite(profit.win_rate) ? profit.win_rate : 0.55
          )
          setStatsAvgPnl(
            Number.isFinite(profit.avg_pnl_per_trade)
              ? profit.avg_pnl_per_trade
              : 0
          )
        }
      })
      .finally(() => setLoading(false))
  }, [form])

  /** 本地估算月化比例：胜率 × 系数，与 avg_pnl 量级无关，仅作演示 */
  const profitRate = useMemo(() => {
    const w = Math.min(1, Math.max(0, statsWinRate))
    const bump = statsAvgPnl > 0 ? Math.min(0.05, statsAvgPnl / 10_000) : 0
    return Math.min(0.2, Math.max(0.01, w * 0.06 + bump))
  }, [statsWinRate, statsAvgPnl])

  const onSave = async () => {
    const values = await form.validateFields().catch(() => null)
    if (!values) return
    setSaving(true)
    try {
      await pmpeApi.updateConfig({
        enabled: values.enabled,
        arb_enabled: values.arb_enabled,
        copy_enabled: values.copy_enabled,
        predict_enabled: values.predict_enabled,
        predict_api_key: values.predict_api_key,
        predict_spread_threshold_pct: values.predict_spread_threshold,
        smart_money: {
          copy_multiplier: values.copy_multiplier,
          min_position_usd: values.max_position,
        },
        arb: {
          min_spread_pct: values.min_spread,
        },
        info_edge: {
          edge_threshold: values.edge_threshold,
        },
      })
      message.success('配置已保存')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const compoundData = useMemo(() => {
    const months = 12
    const data: { month: number; amount: number }[] = [
      { month: 0, amount: principal },
    ]
    let total = principal
    for (let i = 1; i <= months; i++) {
      total *= 1 + profitRate
      data.push({ month: i, amount: Math.round(total) })
    }
    return data
  }, [principal, profitRate])

  const annualPct = ((Math.pow(1 + profitRate, 12) - 1) * 100).toFixed(1)

  return (
    <div style={{ padding: 24, maxWidth: 880 }}>
      <Title level={4} style={{ marginBottom: 16 }}>
        PolyProfit - 配置与策略
      </Title>

      <Form form={form} layout="vertical" disabled={loading}>
        <Card title="全局开关" style={{ marginBottom: 16 }}>
          <Form.Item name="enabled" label="启用 PMPE" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Card>

        <Card title="跟单配置" style={{ marginBottom: 16 }}>
          <Form.Item name="copy_enabled" label="启用跟单" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Space wrap align="start">
            <Form.Item name="copy_multiplier" label="复制倍数" style={{ width: 200 }}>
              <InputNumber min={0.1} max={10} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="max_position"
              label="最大仓位 (USD)"
              style={{ width: 200 }}
            >
              <InputNumber min={100} max={100_000} step={100} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
        </Card>

        <Card title="套利配置" style={{ marginBottom: 16 }}>
          <Form.Item name="arb_enabled" label="启用套利" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="min_spread" label="最小 Spread 阈值（比例）">
            <Slider
              min={0.01}
              max={0.1}
              step={0.005}
              marks={{
                0.01: '1%',
                0.03: '3%',
                0.05: '5%',
                0.1: '10%',
              }}
              tooltip={{ formatter: (v) => `${((v ?? 0) * 100).toFixed(1)}%` }}
            />
          </Form.Item>
        </Card>

        <Card title="Predict.fun 配置" style={{ marginBottom: 16 }}>
          <Form.Item name="predict_enabled" label="启用 Predict.fun" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="predict_api_key" label="API Key" style={{ marginBottom: 12 }}>
            <Input.Password placeholder="输入 Predict.fun API Key" />
          </Form.Item>
          <Form.Item name="predict_spread_threshold" label="Predict.fun Spread 阈值（%）">
            <Slider
              min={0.5}
              max={10}
              step={0.1}
              marks={{
                0.5: '0.5%',
                2: '2%',
                5: '5%',
                10: '10%',
              }}
              tooltip={{ formatter: (v) => `${(v ?? 0).toFixed(1)}%` }}
            />
          </Form.Item>
        </Card>

        <Card title="信息差配置" style={{ marginBottom: 16 }}>
          <Form.Item
            name="info_edge_enabled"
            label="启用信息差扫描"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item name="edge_threshold" label="情绪偏差阈值（比例）">
            <Slider
              min={0.05}
              max={0.3}
              step={0.01}
              marks={{
                0.05: '5%',
                0.12: '12%',
                0.2: '20%',
                0.3: '30%',
              }}
              tooltip={{ formatter: (v) => `${((v ?? 0) * 100).toFixed(0)}%` }}
            />
          </Form.Item>
        </Card>

        <Button type="primary" onClick={onSave} loading={saving} size="large">
          保存配置
        </Button>
      </Form>

      <Divider />

      <Card title="复利模拟器">
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
          预计月化收益率基于历史胜率与平均每笔利润估算：约{' '}
          <strong>{(profitRate * 100).toFixed(2)}%</strong> / 月（本地计算，非投资建议）。
        </Typography.Paragraph>
        <Space style={{ marginBottom: 16 }} wrap>
          <span>本金 ($):</span>
          <InputNumber
            value={principal}
            onChange={(v) => setPrincipal(v ?? 10_000)}
            min={100}
            style={{ width: 160 }}
          />
        </Space>
        <Table
          dataSource={compoundData}
          rowKey="month"
          size="small"
          pagination={false}
          columns={[
            { title: '月份', dataIndex: 'month', key: 'month' },
            {
              title: '预计本金+收益 ($)',
              dataIndex: 'amount',
              key: 'amount',
              render: (v: number) => `$${v.toLocaleString()}`,
            },
          ]}
          footer={() => (
            <div>
              月化收益率: {(profitRate * 100).toFixed(2)}% | 年化（复利）: {annualPct}%
            </div>
          )}
        />
      </Card>
    </div>
  )
}

function mapConfigToForm(cfg: PMPEConfig) {
  return {
    enabled: cfg.enabled,
    arb_enabled: cfg.arb_enabled,
    copy_enabled: cfg.copy_enabled,
    predict_enabled: !!cfg.predict?.api_key,
    predict_api_key: cfg.predict?.api_key ?? '',
    predict_spread_threshold: 2.0,
    copy_multiplier: cfg.smart_money?.copy_multiplier ?? 1.0,
    max_position: cfg.smart_money?.min_position_usd ?? 5000,
    min_spread: cfg.arb?.min_spread_pct ?? 0.03,
    edge_threshold: cfg.info_edge?.edge_threshold ?? 0.12,
    info_edge_enabled: true,
  }
}
