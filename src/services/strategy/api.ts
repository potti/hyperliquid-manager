import { get, post } from '@/lib/api-client'
import type {
  AccountState,
  EnrichedAccount,
  StrategySnapshot,
  TradeResult,
  PointsSnapshot,
} from './types'

const PREFIX = '/api/v1/strategy'

export const strategyApi = {
  listAccounts: () => get<AccountState[]>(`${PREFIX}/accounts`),

  listAccountsEnriched: () => get<EnrichedAccount[]>(`${PREFIX}/accounts-enriched`),

  getAccountSnapshot: (name: string) =>
    get<StrategySnapshot>(`${PREFIX}/accounts/${encodeURIComponent(name)}/snapshot`),

  getAccountTrades: (name: string, limit?: number) =>
    get<TradeResult[]>(`${PREFIX}/accounts/${encodeURIComponent(name)}/trades`, { limit }),

  getAccountPoints: (name: string, limit?: number) =>
    get<PointsSnapshot[]>(`${PREFIX}/accounts/${encodeURIComponent(name)}/points`, { limit }),

  startAccount: (name: string) =>
    post(`${PREFIX}/accounts/${encodeURIComponent(name)}/start`),

  stopAccount: (name: string) =>
    post(`${PREFIX}/accounts/${encodeURIComponent(name)}/stop`),
}
