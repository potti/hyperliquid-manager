'use client'

import { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Space, Button, Spin } from 'antd'
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
} from '@ant-design/icons'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, loading, isAuthenticated } = useAuth()

  // 未登录时重定向到登录页
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/auth/google-login?callbackUrl=${encodeURIComponent(pathname)}`)
    }
  }, [loading, isAuthenticated, router, pathname])

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

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '控制台',
      onClick: () => router.push('/dashboard'),
    },
    {
      key: '/dashboard/futures',
      icon: <RocketOutlined />,
      label: '永续合约',
      children: [
        {
          key: '/dashboard/demo',
          label: '跟单交易',
          onClick: () => router.push('/dashboard/demo'),
        },
        {
          key: '/dashboard/discover',
          label: '发现',
          onClick: () => router.push('/dashboard/discover'),
        },
        {
          key: '/dashboard/collections',
          label: '收藏地址',
          onClick: () => router.push('/dashboard/collections'),
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
          onClick: () => router.push('/dashboard/management/tags'),
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
          selectedKeys={[pathname]}
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
          padding: 24,
          minHeight: 280,
          background: '#f0f2f5'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

