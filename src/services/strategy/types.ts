/** Runtime state of a strategy account (from ListAccounts). */
export interface AccountState {
  name: string
  address: string
  wallet_id?: string
  status: 'idle' | 'running' | 'stopped' | 'error'
  strategy: string
  started_at?: string
  last_tick_at?: string
  error_count: number
  last_error?: string
  trade_count: number
  total_volume: number
  points: number
  balance: number
}

/** Enriched account (from ListAccountsEnriched) — includes live balance/points. */
export interface EnrichedAccount {
  name: string
  address: string
  status: string
  strategy: string
  trade_count: number
  total_volume: number
  points: number
  weekly_points?: number
  rank?: number
  balance: number
  total_pnl?: number
  started_at?: string
  last_tick_at?: string
  error_count: number
  last_error?: string
}

/** Read-only view of an active or completed position. */
export interface PositionView {
  market_id: number
  market_title: string
  side: string
  entry_price: number
  entry_size: number
  status: string
  created_at: string
  entry_filled_at?: string
  exit_price?: number
  hold_duration?: string
  stop_loss_price: number
}

/** Read-only view of a pending order. */
export interface OrderView {
  market_id: number
  market_title: string
  order_id: string
  side: string
  price: number
  size: number
  order_type: 'entry' | 'exit'
}

/** Result of the most recent full market scan. */
export interface ScanSummary {
  scanned_markets: number
  filtered_markets: number
  scan_time: string
}

/** Read-only snapshot of a running strategy's internal state. */
export interface StrategySnapshot {
  account_name: string
  strategy_type: string
  balance: number
  daily_pnl: number
  positions: PositionView[]
  active_orders: OrderView[]
  completed_today: number
  last_scan?: ScanSummary
  extra?: any
}

/** Historical trade record. */
export interface TradeResult {
  OrderID: string
  Side: string
  Price: number
  Size: number
  FilledSize: number
  Duration: number // nanoseconds
}

/** Points snapshot history record. */
export interface PointsSnapshot {
  accountName: string
  points: {
    total_points: number
    weekly_points: number
    rank: number
  }
  recordedAt: string
}
