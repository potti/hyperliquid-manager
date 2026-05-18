import { get, post } from '@/lib/api-client'
import type {
  AccountState,
  EnrichedAccount,
  StrategySnapshot,
  TradeResult,
  PointsSnapshot,
} from './types'

const PREFIX = '/api/v1/strategy'

export interface CreateAccountParams {
  name: string
  wallet_id?: string
  user_uuid?: string
  strategy: string
  enabled?: boolean
  config?: Record<string, any>
}

export const strategyApi = {
  listAccounts: () => get<AccountState[]>(`${PREFIX}/accounts`),

  listAccountsEnriched: () => get<EnrichedAccount[]>(`${PREFIX}/accounts-enriched`),

  createAccount: (params: CreateAccountParams) =>
    post(`${PREFIX}/accounts`, params),

  getAccountSnapshot: (name: string) =>
    get<StrategySnapshot>(`${PREFIX}/accounts/${encodeURIComponent(name)}/snapshot`),

  getAccountTrades: (name: string, limit?: number) =>
    get<TradeResult[]>(`${PREFIX}/accounts/${encodeURIComponent(name)}/trades`, { limit }),

  getAccountPoints: (name: string, limit?: number) =>
    get<PointsSnapshot[]>(`${PREFIX}/accounts/${encodeURIComponent(name)}/points`, { limit }),

  getAccountDashboard: (name: string) =>
    get<any>(`${PREFIX}/accounts/${encodeURIComponent(name)}/dashboard`),

  getBtcMarkets: (name: string) =>
    get<any[]>(`${PREFIX}/accounts/${encodeURIComponent(name)}/btc-markets`),

  // Global cached BTC markets (no account required)
  getCachedBtcMarkets: () => get<{ events: any[]; updated_at: number; scan_count: number }>(`${PREFIX}/btc-markets`),

  getBtcMarketDetail: (id: number) => get<any>(`${PREFIX}/btc-markets/${id}`),

  startAccount: (name: string) =>
    post(`${PREFIX}/accounts/${encodeURIComponent(name)}/start`),

  stopAccount: (name: string) =>
    post(`${PREFIX}/accounts/${encodeURIComponent(name)}/stop`),
}
