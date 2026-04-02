'use client'

import { LinkOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd'

export interface MarketLinkProps {
  kind: 'etherscan' | 'polymarket' | 'kalshi'
  href: string
  label?: string
}

const kindLabel: Record<MarketLinkProps['kind'], string> = {
  etherscan: 'Etherscan',
  polymarket: 'Polymarket',
  kalshi: 'Kalshi',
}

export default function MarketLink({ kind, href, label }: MarketLinkProps) {
  if (!href) return <span>—</span>
  return (
    <Button
      type="link"
      size="small"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      icon={<LinkOutlined />}
      style={{ padding: 0, height: 'auto' }}
    >
      <Space size={4}>
        {label ?? kindLabel[kind]}
      </Space>
    </Button>
  )
}

/** Build Polygon address explorer URL (Polymarket wallets). */
export function polygonAddressUrl(address: string): string {
  const a = address?.trim()
  if (!a) return ''
  return `https://polygonscan.com/address/${a}`
}
