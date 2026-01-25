'use client'

import { useTab } from '@/contexts/TabContext'
import dynamic from 'next/dynamic'
import { UserOutlined } from '@ant-design/icons'

// 动态导入交易员信息 Tab 组件
const TraderInfoTab = dynamic(() => import('@/components/trader/TraderInfoTab'), { ssr: false })

/**
 * Hook: 打开交易员信息 Tab
 * @returns 打开交易员信息 Tab 的函数
 */
export function useOpenTraderTab() {
  const { addTab } = useTab()

  return (address: string) => {
    if (!address) return

    // 使用 address 作为唯一 key
    const tabKey = `/dashboard/trader/${address}`
    
    // 格式化地址显示名称
    const formatAddress = (addr: string) => {
      if (!addr || addr.length < 10) return addr
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    addTab(
      {
        key: tabKey,
        label: `交易员: ${formatAddress(address)}`,
        component: TraderInfoTab,
        closable: true,
        singleton: false, // 多模态：每个 address 可以打开一个
        icon: <UserOutlined />,
      },
      { address } // 传递给组件的 props
    )
  }
}
