'use client'

import TraderInfoPage from '@/app/dashboard/trader/[address]/page'

interface TraderInfoTabProps {
  address: string
}

export default function TraderInfoTab({ address }: TraderInfoTabProps) {
  // 通过 props 传递 address 给 TraderInfoPage
  return <TraderInfoPage address={address} />
}
