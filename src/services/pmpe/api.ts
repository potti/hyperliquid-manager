import { PMPE_API_PREFIX, PMPE_PATHS } from './endpoints'
import type {
  PMPEConfig,
  PMPEConfigPatch,
  PMMarketsListResponse,
  MappingHealthResponse,
  SmartWalletsListResponse,
  ArbOpportunitiesListResponse,
  ProfitStats,
  ProfitHistoryPoint,
  ProfitHistoryResponse,
  PMMarket,
} from './types'

const API_BASE_URL =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:8080'

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${PMPE_API_PREFIX}${path}`
  const baseHeaders = getAuthHeaders()
  const extra = (init?.headers as Record<string, string>) || {}
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: { ...baseHeaders, ...extra },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    const msg =
      typeof err === 'object' && err !== null && 'error' in err
        ? String((err as { error: string }).error)
        : `HTTP ${res.status}`
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}

export const pmpeApi = {
  getConfig: () => request<PMPEConfig>(PMPE_PATHS.config),
  updateConfig: (patch: PMPEConfigPatch) =>
    request<PMPEConfig>(PMPE_PATHS.config, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),

  listMarkets: (params?: { active?: boolean; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.active) q.set('active', '1')
    if (params?.limit != null) q.set('limit', String(params.limit))
    const qs = q.toString()
    return request<PMMarketsListResponse>(
      `${PMPE_PATHS.markets}${qs ? `?${qs}` : ''}`
    )
  },
  getMarket: (eventKey: string) =>
    request<PMMarket>(PMPE_PATHS.market(eventKey)),
  getMappingHealth: () =>
    request<MappingHealthResponse>(PMPE_PATHS.mappingHealth),

  listSmartWallets: (params?: { eligible?: boolean; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.eligible) q.set('eligible', '1')
    if (params?.limit != null) q.set('limit', String(params.limit ?? 100))
    const qs = q.toString()
    return request<SmartWalletsListResponse>(
      `${PMPE_PATHS.smartWallets}${qs ? `?${qs}` : ''}`
    )
  },

  listArbOpportunities: (params?: { status?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.limit != null) q.set('limit', String(params.limit))
    const qs = q.toString()
    return request<ArbOpportunitiesListResponse>(
      `${PMPE_PATHS.arbOpportunities}${qs ? `?${qs}` : ''}`
    )
  },

  getProfitStats: () => request<ProfitStats>(PMPE_PATHS.statsProfit),
  getProfitHistory: async (): Promise<ProfitHistoryResponse> => {
    try {
      const data = await request<ProfitHistoryPoint[]>(
        PMPE_PATHS.statsProfitHistory
      )
      return { data }
    } catch (err) {
      return { data: [], error: err instanceof Error ? err.message : String(err) }
    }
  },
}
