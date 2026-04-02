/** PMPE HTTP API path prefix (relative to API host). */
export const PMPE_API_PREFIX = '/api/pmpe'

export const PMPE_PATHS = {
  config: '/config',
  markets: '/markets',
  market: (eventKey: string) => `/markets/${encodeURIComponent(eventKey)}`,
  mappingHealth: '/mappings/health',
  smartWallets: '/smartwallets',
  arbOpportunities: '/arb/opportunities',
  statsProfit: '/stats/profit',
  statsProfitHistory: '/stats/profit-history',
} as const
