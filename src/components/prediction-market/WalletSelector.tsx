'use client'

import { Button, InputNumber, Select, Space } from 'antd'
import type { SmartWallet } from '@/services/pmpe/types'

export interface WalletSelectorProps {
  wallets: SmartWallet[]
  selectedWallet?: string
  multiplier: number
  onWalletChange: (wallet: string) => void
  onMultiplierChange: (m: number) => void
  onFollow: (wallet: string, multiplier: number) => void
  loading?: boolean
}

export default function WalletSelector({
  wallets,
  selectedWallet,
  multiplier,
  onWalletChange,
  onMultiplierChange,
  onFollow,
  loading,
}: WalletSelectorProps) {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>选择钱包</div>
        <Select
          showSearch
          allowClear
          placeholder="选择要跟单的钱包"
          style={{ width: '100%' }}
          value={selectedWallet || undefined}
          onChange={(v) => onWalletChange(v ?? '')}
          optionFilterProp="label"
          options={wallets.map((w) => ({
            value: w.wallet,
            label: `${w.wallet.slice(0, 10)}…${w.wallet.slice(-6)} (${w.pnl_pct?.toFixed?.(1)}%)`,
          }))}
        />
      </div>
      <div>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>复制倍数</div>
        <InputNumber
          min={0.1}
          max={10}
          step={0.1}
          value={multiplier}
          onChange={(v) => onMultiplierChange(typeof v === 'number' ? v : 1)}
          style={{ width: '100%' }}
        />
      </div>
      <Button
        type="primary"
        block
        loading={loading}
        disabled={!selectedWallet}
        onClick={() =>
          selectedWallet && onFollow(selectedWallet, multiplier)
        }
      >
        跟单
      </Button>
    </Space>
  )
}
