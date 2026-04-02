'use client'

import ReactECharts from 'echarts-for-react'

export interface StrategyMixPieProps {
  copy: number
  arb: number
  info: number
  height?: number
}

export default function StrategyMixPie({
  copy,
  arb,
  info,
  height = 320,
}: StrategyMixPieProps) {
  const option = {
    title: {
      text: '策略分布（估算）',
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        name: '策略',
        type: 'pie',
        radius: ['36%', '62%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%' },
        data: [
          { value: copy, name: '跟单 copy' },
          { value: arb, name: '套利 arb' },
          { value: info, name: '信息差 info' },
        ],
      },
    ],
  }

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      notMerge
      lazyUpdate
    />
  )
}
