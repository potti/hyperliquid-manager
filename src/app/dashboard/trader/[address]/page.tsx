'use client'

import { useParams } from 'next/navigation'
import TraderInfoContent from '@/components/trader/TraderInfoContent'

export default function TraderInfoPage() {
  const params = useParams()
  const address = params.address as string

  if (!address) {
    return null
  }

  return <TraderInfoContent address={address} />
}
