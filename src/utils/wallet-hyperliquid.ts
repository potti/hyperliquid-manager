/**
 * GET /api/v1/wallet/list returns Hyperliquid balance fields on each wallet object
 * (account_value, withdrawable, …) at the root. Some UI code expects them under
 * `hyperliquid`. Normalize so both shapes work.
 */
export type WalletHyperliquidBalances = {
  account_value?: string | number
  unrealized_pnl?: string | number
  margin_used?: string | number
  withdrawable?: string | number
  is_registered?: boolean
}

export type WalletWithOptionalHl = WalletHyperliquidBalances & {
  hyperliquid?: WalletHyperliquidBalances
}

export function normalizeWalletHyperliquid<T extends WalletWithOptionalHl>(w: T): T {
  if (w.hyperliquid) return w
  const hasFlat =
    w.account_value !== undefined ||
    w.unrealized_pnl !== undefined ||
    w.margin_used !== undefined ||
    w.withdrawable !== undefined ||
    w.is_registered !== undefined
  if (!hasFlat) return w
  return {
    ...w,
    hyperliquid: {
      account_value: w.account_value,
      unrealized_pnl: w.unrealized_pnl,
      margin_used: w.margin_used,
      withdrawable: w.withdrawable,
      is_registered: w.is_registered,
    },
  }
}

export function normalizeWalletsHyperliquid<T extends WalletWithOptionalHl>(wallets: T[]): T[] {
  return wallets.map(normalizeWalletHyperliquid)
}

/** Parse API numeric fields whether encoded as JSON number or string */
export function toFiniteNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0
  const n = typeof value === 'number' ? value : parseFloat(String(value).trim())
  return Number.isFinite(n) ? n : 0
}
