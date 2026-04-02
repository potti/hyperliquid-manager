'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'antd'
import type { MenuProps } from 'antd'

const items: MenuProps['items'] = [
  {
    key: '/prediction-market/dashboard',
    label: <Link href="/prediction-market/dashboard">概览仪表盘</Link>,
  },
  {
    key: '/prediction-market/smartmoney',
    label: <Link href="/prediction-market/smartmoney">聪明钱跟单</Link>,
  },
  {
    key: '/prediction-market/arbitrage',
    label: <Link href="/prediction-market/arbitrage">套利机会扫描</Link>,
  },
  {
    key: '/prediction-market/markets',
    label: <Link href="/prediction-market/markets">市场数据列表</Link>,
  },
  {
    key: '/prediction-market/trades',
    label: <Link href="/prediction-market/trades">交易历史记录</Link>,
  },
  {
    key: '/prediction-market/settings',
    label: <Link href="/prediction-market/settings">配置与策略</Link>,
  },
  {
    key: '/prediction-market/monitoring',
    label: <Link href="/prediction-market/monitoring">监控告警</Link>,
  },
]

export default function PredictionMarketSubNav() {
  const pathname = usePathname()
  if (!pathname?.startsWith('/prediction-market')) return null

  return (
    <div
      style={{
        marginBottom: 16,
        background: '#fff',
        padding: '0 8px',
        borderRadius: 8,
        border: '1px solid #f0f0f0',
      }}
    >
      <Menu
        mode="horizontal"
        selectedKeys={[pathname]}
        items={items}
        style={{ borderBottom: 'none', lineHeight: '48px' }}
      />
    </div>
  )
}
