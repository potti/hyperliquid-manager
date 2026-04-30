'use client'

import { useEffect } from 'react'
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
 * PMPE 实时频道。connected=false 表示尚未接入真实 WebSocket（无统一 WS 客户端）。
 * TODO: 接入现有统一 WS 客户端后替换此处实现。
 */
export function usePMPEWebSocket(enabled = true): UsePMPEWebSocketResult {
  // No mock data - always return disconnected state until real WS is integrated
  useEffect(() => {
    // no-op: no WebSocket subscription yet
  }, [enabled])

  return {
    connected: false,
    lastProfitUpdate: null,
    lastNewOpportunity: null,
    lastCopyTrade: null,
  }
}