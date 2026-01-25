'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'

// Tab 配置接口
export interface TabConfig {
  key: string
  label: string
  component: React.ComponentType<any>
  closable?: boolean
  singleton?: boolean // true: 单模态（只能打开一个实例），false: 多模态（可以打开多个实例）
  icon?: React.ReactNode
}

// Tab 实例接口
export interface TabInstance {
  key: string
  label: string
  component: React.ComponentType<any>
  closable: boolean
  props?: any // 传递给组件的 props
  icon?: React.ReactNode
}

// Tab Context 类型
interface TabContextType {
  tabs: TabInstance[]
  activeKey: string | null
  addTab: (config: TabConfig, props?: any) => void
  removeTab: (key: string) => void
  setActiveKey: (key: string | null) => void
  closeTab: (key: string) => void
  closeOtherTabs: (key: string) => void
  closeAllTabs: () => void
}

// 创建 Context
const TabContext = createContext<TabContextType | undefined>(undefined)

// Tab Provider 组件
export function TabProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<TabInstance[]>([])
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const pendingActiveKeyRef = useRef<string | null>(null)

  // 当 tabs 更新后，激活待激活的 tab
  useEffect(() => {
    if (pendingActiveKeyRef.current) {
      const keyToActivate = pendingActiveKeyRef.current
      const tabExists = tabs.some((tab) => tab.key === keyToActivate)
      if (tabExists) {
        setActiveKey(keyToActivate)
        pendingActiveKeyRef.current = null
      }
    }
  }, [tabs])

  // 添加 Tab
  const addTab = useCallback((config: TabConfig, props?: any) => {
    setTabs((prevTabs) => {
      if (config.singleton) {
        // 单模态：如果已存在，则激活它；否则创建新的
        const existingTab = prevTabs.find((tab) => tab.key === config.key)
        if (existingTab) {
          setActiveKey(config.key)
          return prevTabs
        }
        // 移除旧的同名 tab（如果有）
        const filteredTabs = prevTabs.filter((tab) => tab.key !== config.key)
        const newTab: TabInstance = {
          key: config.key,
          label: config.label,
          component: config.component,
          closable: config.closable ?? true,
          props,
          icon: config.icon,
        }
        pendingActiveKeyRef.current = config.key
        return [...filteredTabs, newTab]
      } else {
        // 多模态：检查是否已存在相同的 key
        const existingTab = prevTabs.find((tab) => tab.key === config.key)
        if (existingTab) {
          // 如果已存在，激活它
          setActiveKey(config.key)
          return prevTabs
        }
        // 创建新的 tab
        const newTab: TabInstance = {
          key: config.key,
          label: config.label,
          component: config.component,
          closable: config.closable ?? true,
          props,
          icon: config.icon,
        }
        pendingActiveKeyRef.current = config.key
        return [...prevTabs, newTab]
      }
    })
  }, [])

  // 移除 Tab
  const removeTab = useCallback((key: string) => {
    setTabs((prevTabs) => {
      const newTabs = prevTabs.filter((tab) => tab.key !== key)
      // 如果移除的是当前活动的 tab，激活最后一个 tab
      if (activeKey === key) {
        if (newTabs.length > 0) {
          setActiveKey(newTabs[newTabs.length - 1].key)
        } else {
          setActiveKey(null)
        }
      }
      return newTabs
    })
  }, [activeKey])

  // 设置活动 Tab
  const setActiveKeyHandler = useCallback((key: string | null) => {
    setActiveKey(key)
  }, [])

  // 关闭 Tab
  const closeTab = useCallback((key: string) => {
    removeTab(key)
  }, [removeTab])

  // 关闭其他 Tabs
  const closeOtherTabs = useCallback((key: string) => {
    setTabs((prevTabs) => {
      return prevTabs.filter((tab) => tab.key === key)
    })
    setActiveKey(key)
  }, [])

  // 关闭所有 Tabs
  const closeAllTabs = useCallback(() => {
    setTabs([])
    setActiveKey(null)
  }, [])

  return (
    <TabContext.Provider
      value={{
        tabs,
        activeKey,
        addTab,
        removeTab,
        setActiveKey: setActiveKeyHandler,
        closeTab,
        closeOtherTabs,
        closeAllTabs,
      }}
    >
      {children}
    </TabContext.Provider>
  )
}

// 使用 Tab Context 的 Hook
export function useTab() {
  const context = useContext(TabContext)
  if (context === undefined) {
    throw new Error('useTab must be used within a TabProvider')
  }
  return context
}
