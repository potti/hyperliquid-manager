export interface SignalLog {
  id: string
  source: 'chanlun' | 'whale' | 'rule'
  symbol: string
  direction: 'buy' | 'sell'
  strength: number
  raw_data: Record<string, any>
  tracks?: SignalPriceTrack[]
  created_at: string
}

export interface SignalPriceTrack {
  id: string
  signal_id: string
  symbol: string
  direction: string
  market_id: number
  market_title: string
  yes_price_0h: number
  no_price_0h: number
  yes_price_1h?: number
  no_price_1h?: number
  yes_price_6h?: number
  no_price_6h?: number
  yes_price_24h?: number
  no_price_24h?: number
  correct_1h?: boolean
  correct_6h?: boolean
  correct_24h?: boolean
  status: 'pending' | 'partial' | 'resolved'
}

export interface ConflictRecord {
  id: string
  symbol: string
  signal_a: string
  signal_b: string
  description: string
  resolved_a?: boolean
  created_at: string
}

export interface SignalStats {
  [key: string]: {
    total: number
    correct: number
    rate: number
  } | number
}
