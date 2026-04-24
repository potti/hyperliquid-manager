// ---------- Config ----------
export interface PMPEConfig {
  enabled: boolean
  sync_interval_sec?: number
  arb_enabled: boolean
  copy_enabled: boolean
  polymarket?: { gamma_api_url?: string; data_api_url?: string }

  predict?: { api_url?: string; api_key?: string }
  smart_money?: SmartMoneyConfigDTO
  arb?: ArbConfigDTO
  info_edge?: InfoEdgeConfigDTO
}

export interface SmartMoneyConfigDTO {
  min_pnl_pct?: number
  min_win_rate?: number
  min_position_usd?: number
  scan_interval_sec?: number
  copy_multiplier?: number
}
export interface ArbConfigDTO {
  min_spread_pct?: number
  max_spread_pct?: number
  scan_interval_sec?: number
}
export interface InfoEdgeConfigDTO {
  edge_threshold?: number
  lookback_days?: number
  retention_days?: number
  max_markets_per_run?: number
}
export interface PMPEConfigPatch {
  enabled?: boolean
  arb_enabled?: boolean
  copy_enabled?: boolean
  predict_enabled?: boolean
  predict_api_key?: string
  predict_spread_threshold_pct?: number
  smart_money?: Partial<SmartMoneyConfigDTO>
  arb?: Partial<ArbConfigDTO>
  info_edge?: Partial<InfoEdgeConfigDTO>
}

// ---------- Markets ----------
export interface PMMarketQuotes {
  poly_yes: number
  poly_no: number
  predict_yes: number
  predict_no: number
  updated_at: number
}
export interface PMMarketMapping {
  poly: { event_id: string; market_ids: string[]; slug: string }

  predict: { market_id: string; title: string; chain: string }
  confidence: number
  method: string
}
export interface PMMarket {
  event_key: string
  event_title: string
  event_category: string
  event_start_ts: number
  event_end_ts: number
  mapping: PMMarketMapping
  quotes: PMMarketQuotes
  liquidity: { poly: number; predict: number; min_liquidity_ok: boolean }
  state: { is_active: boolean; is_resolved: boolean }
}
export interface PMMarketsListResponse {
  count: number
  markets: PMMarket[]
}

// ---------- Mapping health ----------
export interface MappingHealthResponse {
  total_markets: number
  mapped_markets: number
  mapping_ratio: number
  needs_review_count: number
  health_status: 'excellent' | 'good' | 'fair' | 'poor'
}

// ---------- Smart wallets ----------
export interface SmartWallet {
  source: string
  wallet: string
  window: string
  pnl_pct: number
  win_rate: number
  avg_position_usd: number
  last_seen_ts: number
  eligible: boolean
  reason: string
}
export interface SmartWalletsListResponse {
  count: number
  wallets: SmartWallet[]
}

// ---------- Arbitrage ----------
export interface ArbLeg {
  venue: 'polymarket' | 'predict'
  side: 'YES' | 'NO'
  price: number
  size: number
}
export interface ArbOpportunity {
  id?: string
  event_key: string
  pm_market_id: string
  direction: string
  legs: { leg_a: ArbLeg; leg_b: ArbLeg }
  gross_spread: number
  fee_estimate: number
  slippage_estimate: number
  net_spread: number
  threshold: number
  status: string
  created_at: number
  updated_at: number
  tx_hash?: string
}
export interface ArbOpportunitiesListResponse {
  count: number
  opportunities: ArbOpportunity[]
}

// ---------- Profit stats ----------
export interface ProfitStats {
  total_pnl: number
  trade_count: number
  win_rate: number
  avg_pnl_per_trade: number
  note?: string
}
export interface ProfitHistoryPoint {
  date: string
  pnl: number
  cumulative?: number
}

// ---------- WebSocket payloads ----------
export interface WsProfitUpdatePayload {
  channel: 'pmpe:profit-update'
  today_pnl: number
  cumulative_pnl: number
  win_rate: number
  arb_count_24h?: number
  ts: number
}
export interface WsNewOpportunityPayload {
  channel: 'pmpe:new-opportunity'
  opportunity: ArbOpportunity
  ts: number
}
export interface WsCopyTradePayload {
  channel: 'pmpe:copy-trade'
  wallet: string
  market_id: string
  side: string
  amount: number
  ts: number
}
