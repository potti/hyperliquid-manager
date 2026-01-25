'use client'

import { TabConfig } from '@/contexts/TabContext'
import {
  DashboardOutlined,
  RocketOutlined,
  AppstoreOutlined,
  TagsOutlined,
} from '@ant-design/icons'

// 动态导入页面组件（避免在初始加载时加载所有页面，实现代码分割）
import dynamic from 'next/dynamic'

const DashboardPage = dynamic(() => import('@/app/dashboard/page'), { ssr: false })
const DemoPage = dynamic(() => import('@/app/dashboard/demo/page'), { ssr: false })
const DiscoverPage = dynamic(() => import('@/app/dashboard/discover/page'), { ssr: false })
const CollectionsPage = dynamic(() => import('@/app/dashboard/collections/page'), { ssr: false })
const TagsPage = dynamic(() => import('@/app/dashboard/management/tags/page'), { ssr: false })

// Tab 配置映射
export const tabConfigMap: Record<string, TabConfig> = {
  '/dashboard': {
    key: '/dashboard',
    label: '控制台',
    component: DashboardPage,
    closable: false, // 控制台不可关闭
    singleton: true, // 单模态
    icon: <DashboardOutlined />,
  },
  '/dashboard/demo': {
    key: '/dashboard/demo',
    label: '跟单交易',
    component: DemoPage,
    closable: true,
    singleton: true, // 单模态：只能打开一个跟单交易页面
    icon: <RocketOutlined />,
  },
  '/dashboard/discover': {
    key: '/dashboard/discover',
    label: '发现',
    component: DiscoverPage,
    closable: true,
    singleton: true, // 单模态：只能打开一个发现页面
    icon: <RocketOutlined />,
  },
  '/dashboard/collections': {
    key: '/dashboard/collections',
    label: '收藏地址',
    component: CollectionsPage,
    closable: true,
    singleton: true, // 单模态：只能打开一个收藏地址页面
    icon: <RocketOutlined />,
  },
  '/dashboard/management/tags': {
    key: '/dashboard/management/tags',
    label: '标签管理',
    component: TagsPage,
    closable: true,
    singleton: true, // 单模态：只能打开一个标签管理页面
    icon: <TagsOutlined />,
  },
}

// 获取 Tab 配置
export function getTabConfig(key: string): TabConfig | undefined {
  return tabConfigMap[key]
}

// 获取所有 Tab 配置
export function getAllTabConfigs(): TabConfig[] {
  return Object.values(tabConfigMap)
}
