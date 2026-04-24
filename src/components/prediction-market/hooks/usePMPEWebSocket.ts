'use client'

import { useEffect, useState } from 'react'
import type {
  WsCopyTradePayload,
  WsNewOpportunityPayload,
  WsProfitUpdatePayload,
} from '@/services/pmpe/types'

export interface UsePMPEWebSocketResult {
  connected: boolean
  lastProfitUpdate: WsProfitUpdatePayload | null
  lastNewOpportunity: WsNewOpportunityPayload | null
  lastCopyTrade: WsCopyTradePayload | null
}

/**
 * PMPE real-time channel hook.
 *
 * Backend WebSocket endpoint not yet implemented (TODO(pmpe-ws): subscribe on shared socket).
 * Returns connected=false with no data until a real WS endpoint is available.
 */
export function usePMPEWebSocket(enabled = true): UsePMPEWebSocketResult {
  const [connected, setConnected] = useState(false)
  const [lastProfitUpdate, setLastProfitUpdate] =
    useState<WsProfitUpdatePayload | null>(null)
  const [lastNewOpportunity, setLastNewOpportunity] =
    useState<WsNewOpportunityPayload | null>(null)
  const [lastCopyTrade, setLastCopyTrade] =
    useState<WsCopyTradePayload | null>(null)

  useEffect(() => {
    if (!enabled) return
    // TODO(pmpe-ws): connect to backend WS and subscribe to:
    //   - pmpe:profit-update
    //   - pmpe:new-opportunity
    //   - pmpe:copy-trade
    // Connected state and data updates should be driven by the real socket.
    setConnected(false)
    return () => setConnected(false)
  }, [enabled])

  return {
    connected,
    lastProfitUpdate,
    lastNewOpportunity,
    lastCopyTrade,
  }
}
