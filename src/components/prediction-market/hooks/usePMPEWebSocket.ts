'use client'

import { useCallback, useEffect, useState } from 'react'
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
 * PMPE 实时频道。当前项目无统一 WebSocket 客户端，使用定时模拟推送（TODO: 接入现有 WS）。
 */
export function usePMPEWebSocket(enabled = true): UsePMPEWebSocketResult {
  const [connected, setConnected] = useState(false)
  const [lastProfitUpdate, setLastProfitUpdate] =
    useState<WsProfitUpdatePayload | null>(null)
  const [lastNewOpportunity, setLastNewOpportunity] =
    useState<WsNewOpportunityPayload | null>(null)
  const [lastCopyTrade, setLastCopyTrade] =
    useState<WsCopyTradePayload | null>(null)

  const pushMockProfit = useCallback(() => {
    setLastProfitUpdate({
      channel: 'pmpe:profit-update',
      today_pnl: Math.random() * 100 - 20,
      cumulative_pnl: Math.random() * 5000,
      win_rate: 0.55 + Math.random() * 0.1,
      arb_count_24h: Math.floor(Math.random() * 12),
      ts: Date.now(),
    })
  }, [])

  useEffect(() => {
    if (!enabled) return

    // TODO(pmpe-ws): subscribe pmpe:profit-update | pmpe:new-opportunity | pmpe:copy-trade on shared socket
    const t0 = setTimeout(() => {
      setConnected(true)
      pushMockProfit()
    }, 800)

    const profitIv = setInterval(pushMockProfit, 45_000)

    const oppIv = setInterval(() => {
      setLastNewOpportunity({
        channel: 'pmpe:new-opportunity',
        opportunity: {
          event_key: `evt_${Date.now()}`,
          pm_market_id: 'mock',
          direction: 'buy_poly_yes_kalshi_no',
          legs: {
            leg_a: {
              venue: 'polymarket',
              side: 'YES',
              price: 0.5,
              size: 0,
            },
            leg_b: {
              venue: 'kalshi',
              side: 'NO',
              price: 0.45,
              size: 0,
            },
          },
          gross_spread: 0.05,
          fee_estimate: 0.01,
          slippage_estimate: 0.005,
          net_spread: 0.035,
          threshold: 0.03,
          status: 'new',
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        },
        ts: Date.now(),
      })
    }, 60_000)

    const copyIv = setInterval(() => {
      setLastCopyTrade({
        channel: 'pmpe:copy-trade',
        wallet: '0x' + Math.floor(Math.random() * 1e16).toString(16).padStart(40, '0'),
        market_id: `m_${Math.floor(Math.random() * 1e6)}`,
        side: Math.random() > 0.5 ? 'YES' : 'NO',
        amount: Math.round(Math.random() * 5000) / 10,
        ts: Date.now(),
      })
    }, 22_000)

    return () => {
      clearTimeout(t0)
      clearInterval(profitIv)
      clearInterval(oppIv)
      clearInterval(copyIv)
      setConnected(false)
    }
  }, [enabled, pushMockProfit])

  return {
    connected,
    lastProfitUpdate,
    lastNewOpportunity,
    lastCopyTrade,
  }
}
