'use client'

import { TabConfig } from '@/contexts/TabContext'
import {
  DashboardOutlined,
  RocketOutlined,
  AppstoreOutlined,
  TagsOutlined,
  LineChartOutlined,
} from '@ant-design/icons'

// 动态导入页面组件（避免在初始加载时加载所有页面，实现代码分割）
import dynamic from 'next/dynamic'

const DashboardPage = dynamic(() => import('@/app/dashboard/page'), { ssr: false })
const DemoPage = dynamic(() => import('@/app/dashboard/demo/page'), { ssr: false })
const DiscoverPage = dynamic(() => import('@/app/dashboard/discover/page'), { ssr: false })
const CollectionsPage = dynamic(() => import('@/app/dashboard/collections/page'), { ssr: false })
const FundingRatesPage = dynamic(() => import('@/app/dashboard/funding-rates/page'), { ssr: false })
const MarketDailyMetricsPage = dynamic(() => import('@/app/dashboard/market-daily-metrics/page'), { ssr: false })
const TagsPage = dynamic(() => import('@/app/dashboard/management/tags/page'), { ssr: false })

const PolyProfitDashboard = dynamic(
  () => import('@/components/prediction-market/PolyProfitDashboard'),
  { ssr: false }
)
const PolyProfitSmartMoney = dynamic(
  () => import('@/app/prediction-market/smartmoney/page'),
  { ssr: false }
)
const PolyProfitArbitrage = dynamic(
  () => import('@/app/prediction-market/arbitrage/page'),
  { ssr: false }
)
const PolyProfitMarkets = dynamic(
  () => import('@/app/prediction-market/markets/page'),
  { ssr: false }
)
const PolyProfitTrades = dynamic(
  () => import('@/app/prediction-market/trades/page'),
  { ssr: false }
)
const PolyProfitSettings = dynamic(
  () => import('@/app/prediction-market/settings/page'),
  { ssr: false }
)
const PolyProfitMonitoring = dynamic(
  () => import('@/app/prediction-market/monitoring/page'),
  { ssr: false }
)

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
  '/dashboard/funding-rates': {
    key: '/dashboard/funding-rates',
    label: '资金费率',
    component: FundingRatesPage,
    closable: true,
    singleton: true,
    icon: <RocketOutlined />,
  },
  '/dashboard/market-daily-metrics': {
    key: '/dashboard/market-daily-metrics',
    label: '市场日度指标',
    component: MarketDailyMetricsPage,
    closable: true,
    singleton: true,
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
  '/prediction-market/dashboard': {
    key: '/prediction-market/dashboard',
    label: '概览仪表盘',
    component: PolyProfitDashboard,
    closable: true,
    singleton: true,
    icon: <LineChartOutlined />,
  },
  '/prediction-market/smartmoney': {
    key: '/prediction-market/smartmoney',
    label: '聪明钱跟单',
    component: PolyProfitSmartMoney,
    closable: true,
    singleton: true,
    icon: <LineChartOutlined />,
  },
  '/prediction-market/arbitrage': {
    key: '/prediction-market/arbitrage',
    label: '套利机会扫描',
    component: PolyProfitArbitrage,
    closable: true,
    singleton: true,
    icon: <LineChartOutlined />,
  },
  '/prediction-market/markets': {
    key: '/prediction-market/markets',
    label: '市场数据列表',
    component: PolyProfitMarkets,
    closable: true,
    singleton: true,
    icon: <LineChartOutlined />,
  },
  '/prediction-market/trades': {
    key: '/prediction-market/trades',
    label: '交易历史记录',
    component: PolyProfitTrades,
    closable: true,
    singleton: true,
    icon: <LineChartOutlined />,
  },
  '/prediction-market/settings': {
    key: '/prediction-market/settings',
    label: '配置与策略',
    component: PolyProfitSettings,
    closable: true,
    singleton: true,
    icon: <LineChartOutlined />,
  },
  '/prediction-market/monitoring': {
    key: '/prediction-market/monitoring',
    label: '监控告警',
    component: PolyProfitMonitoring,
    closable: true,
    singleton: true,
    icon: <LineChartOutlined />,
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
