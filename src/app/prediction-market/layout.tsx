'use client'

import DashboardLayout from '@/components/DashboardLayout'

export default function PredictionMarketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
