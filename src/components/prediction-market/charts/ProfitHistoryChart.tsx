'use client'

import ReactECharts from 'echarts-for-react'
import type { ProfitHistoryPoint } from '@/services/pmpe/types'

export interface ProfitHistoryChartProps {
  data: ProfitHistoryPoint[]
  height?: number
}

export default function ProfitHistoryChart({
  data,
  height = 320,
}: ProfitHistoryChartProps) {
  const dates = data.map((d) => d.date)
  const pnl = data.map((d) => d.pnl)

  const option = {
    title: {
      text: '近 7 日 PnL',
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 24, top: 48, bottom: 32 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
    },
    yAxis: { type: 'value', name: 'PNL' },
    series: [
      {
        name: 'PnL',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: '#1890ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24,144,255,0.45)' },
              { offset: 1, color: 'rgba(24,144,255,0.02)' },
            ],
          },
        },
        data: pnl,
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
