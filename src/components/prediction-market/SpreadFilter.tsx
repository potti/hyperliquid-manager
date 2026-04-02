'use client'

import { Slider, Space, Typography } from 'antd'

export interface SpreadFilterProps {
  minSpread: number
  maxSpread?: number
  onChange: (min: number) => void
}

/**
 * minSpread / maxSpread 为比例小数，如 0.03 = 3%
 */
export default function SpreadFilter({
  minSpread,
  maxSpread = 0.2,
  onChange,
}: SpreadFilterProps) {
  const pct = minSpread * 100
  const maxPct = maxSpread * 100

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Typography.Text strong>最小 Spread（%）</Typography.Text>
      <Slider
        min={0}
        max={maxPct}
        step={0.5}
        value={pct}
        tooltip={{ formatter: (v) => `${v}%` }}
        onChange={(v) => onChange((v ?? 0) / 100)}
      />
      <Typography.Text type="secondary">
        当前阈值：{(minSpread * 100).toFixed(2)}%
      </Typography.Text>
    </Space>
  )
}
