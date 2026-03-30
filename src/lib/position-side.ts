/**
 * 判断是否为做多方向。Hyperliquid API 多为小写 long/short；
 * 库内历史仓位等可能为大写 Long/Short。
 */
export function isLongPositionSide(side: string | undefined | null): boolean {
  if (side == null || side === '') return false
  return side.toLowerCase() === 'long'
}
