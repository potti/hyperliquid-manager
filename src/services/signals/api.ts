import { get } from '@/lib/api-client'
import type { SignalLog, ConflictRecord, SignalStats } from './types'

const PREFIX = '/api/v1/signals'

export const signalApi = {
  getSignals: (params?: { source?: string; symbol?: string; limit?: number }) =>
    get<SignalLog[]>(PREFIX, params),

  getConflicts: (params?: { limit?: number }) =>
    get<ConflictRecord[]>(`${PREFIX}/conflicts`, params),

  getStats: () =>
    get<SignalStats>(`${PREFIX}/stats`),
}
