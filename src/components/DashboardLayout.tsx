'use client'

import { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Space, Button, Spin, Tabs } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  RocketOutlined,
  AppstoreOutlined,
  TagsOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTab } from '@/contexts/TabContext'
import { getTabConfig } from '@/config/tab-config'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

export default function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, loading, isAuthenticated } = useAuth()
  const { tabs, activeKey, addTab, setActiveKey, closeTab, closeOtherTabs, closeAllTabs } = useTab()

  // 未登录时重定向到登录页
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/auth/google-login?callbackUrl=${encodeURIComponent(pathname)}`)
    }
  }, [loading, isAuthenticated, router, pathname])

  // 初始化：根据 pathname 打开对应的 tab（仅在首次加载时，且未初始化过）
  useEffect(() => {
    if (isAuthenticated && !initialized && tabs.length === 0) {
      // 如果当前 pathname 有对应的 tab 配置，则打开它
      const config = getTabConfig(pathname)
      if (config) {
        addTab(config)
        setInitialized(true)
      } else if (pathname === '/dashboard' || pathname.startsWith('/dashboard')) {
        // 只有在明确访问 /dashboard 路径时才默认打开控制台
        const dashboardConfig = getTabConfig('/dashboard')
        if (dashboardConfig) {
          addTab(dashboardConfig)
          setInitialized(true)
        }
      } else {
        // 即使没有匹配的配置，也标记为已初始化，避免后续触发
        setInitialized(true)
      }
    }
  }, [isAuthenticated, initialized, pathname, tabs.length, addTab])

  // 加载中
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  // 未登录
  if (!isAuthenticated) {
    return null
  }

  // 处理菜单点击：打开或切换到对应的 tab
  const handleMenuClick = (key: string) => {
    const config = getTabConfig(key)
    if (config) {
      addTab(config)
    }
  }

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '控制台',
      onClick: () => handleMenuClick('/dashboard'),
    },
    {
      key: '/dashboard/futures',
      icon: <RocketOutlined />,
      label: '永续合约',
      children: [
        {
          key: '/dashboard/demo',
          label: '跟单交易',
          onClick: () => handleMenuClick('/dashboard/demo'),
        },
        {
          key: '/dashboard/discover',
          label: '发现',
          onClick: () => handleMenuClick('/dashboard/discover'),
        },
        {
          key: '/dashboard/collections',
          label: '收藏地址',
          onClick: () => handleMenuClick('/dashboard/collections'),
        },
      ],
    },
    {
      key: '/dashboard/management',
      icon: <AppstoreOutlined />,
      label: '管理',
      children: [
        {
          key: '/dashboard/management/tags',
          icon: <TagsOutlined />,
          label: '标签管理',
          onClick: () => handleMenuClick('/dashboard/management/tags'),
        },
      ],
    },
  ]

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账户设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => logout(),
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 24 : 20,
          fontWeight: 'bold'
        }}>
          {collapsed ? <RocketOutlined /> : 'Hyperliquid'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={activeKey ? [activeKey] : [pathname]}
          defaultOpenKeys={['/dashboard/futures', '/dashboard/management']}
          items={menuItems}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name || '用户'}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{
          margin: '24px 16px',
          padding: 0,
          minHeight: 280,
          background: '#f0f2f5'
        }}>
          {tabs.length > 0 ? (
            <Tabs
              type="editable-card"
              activeKey={activeKey || undefined}
              onChange={(key) => setActiveKey(key)}
              onEdit={(targetKey, action) => {
                if (action === 'remove') {
                  closeTab(targetKey as string)
                }
              }}
              hideAdd
              items={tabs.map((tab) => ({
                key: tab.key,
                label: tab.label,
                closable: tab.closable,
                children: (
                  <div style={{ padding: 24, background: '#fff', minHeight: 'calc(100vh - 200px)' }}>
                    <tab.component {...(tab.props || {})} />
                  </div>
                ),
              }))}
              style={{
                background: '#f0f2f5',
              }}
              tabBarStyle={{
                margin: 0,
                padding: '0 16px',
                background: '#fff',
                borderBottom: '1px solid #f0f0f0',
              }}
            />
          ) : (
            <div style={{ padding: 24 }}>
              {children}
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  )
}

