'use client'

import DashboardLayout from '@/components/DashboardLayout'
import PredictionMarketSubNav from '@/components/prediction-market/PredictionMarketSubNav'

export default function PredictionMarketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout>
      <PredictionMarketSubNav />
      {children}
    </DashboardLayout>
  )
}
