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
    const polyPredictArbCount = Math.floor(Math.random() * 3) // 0-2 poly_predict_arb in 24h
    const totalArbCount = Math.floor(Math.random() * 12)
    setLastProfitUpdate({
      channel: 'pmpe:profit-update',
      today_pnl: polyPredictArbCount * (Math.random() * 50 + 20) - 20,
      cumulative_pnl: polyPredictArbCount * 500 + Math.random() * 5000,
      win_rate: 0.55 + Math.random() * 0.1,
      arb_count_24h: polyPredictArbCount,
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

    const venues: Array<'polymarket'|'predict'> = ['polymarket', 'predict']
    const oppIv = setInterval(() => {
      // 20% chance of poly_predict_arb opportunity
      const isPolyPredict = Math.random() < 0.2
      const legA: { venue: 'polymarket'|'predict'; side: 'YES'|'NO'; price: number; size: number } = {
        venue: isPolyPredict ? 'polymarket' : 'polymarket',
        side: 'YES',
        price: 0.3 + Math.random() * 0.4,
        size: 0,
      }
      const legB: { venue: 'polymarket'|'predict'; side: 'YES'|'NO'; price: number; size: number } = {
        venue: isPolyPredict ? 'predict' : 'polymarket',
        side: 'NO',
        price: 0.25 + Math.random() * 0.35,
        size: 0,
      }
      const netSpread = isPolyPredict
        ? 0.025 + Math.random() * 0.06
        : 0.03 + Math.random() * 0.04
      setLastNewOpportunity({
        channel: 'pmpe:new-opportunity',
        opportunity: {
          event_key: `evt_${Date.now()}`,
          pm_market_id: 'mock',
          direction: isPolyPredict ? 'poly_predict_arb' : 'poly_yes_no_arb',
          legs: { leg_a: legA, leg_b: legB },
          gross_spread: netSpread + 0.01,
          fee_estimate: 0.01,
          slippage_estimate: 0.005,
          net_spread: netSpread,
          threshold: 0.03,
          status: 'new',
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
          tx_hash: isPolyPredict ? `0x${Math.floor(Math.random() * 1e16).toString(16).padStart(64,'0')}` : undefined,
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
