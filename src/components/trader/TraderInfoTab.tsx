'use client'

import TraderInfoContent from '@/components/trader/TraderInfoContent'

interface TraderInfoTabProps {
  address: string
}

export default function TraderInfoTab({ address }: TraderInfoTabProps) {
  // 通过 props 传递 address 给 TraderInfoContent
  return <TraderInfoContent address={address} />
}
