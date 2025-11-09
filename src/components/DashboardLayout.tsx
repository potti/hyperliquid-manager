'use client'

import { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Space, Button } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { useRouter, usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '控制台',
      onClick: () => router.push('/dashboard'),
    },
    {
      key: '/dashboard/demo',
      icon: <RocketOutlined />,
      label: 'Demo',
      onClick: () => router.push('/dashboard/demo'),
    },
    {
      key: '/dashboard/users',
      icon: <UserOutlined />,
      label: '用户管理',
      onClick: () => router.push('/dashboard/users'),
    },
    {
      key: '/dashboard/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => router.push('/dashboard/settings'),
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
      onClick: () => signOut({ callbackUrl: '/' }),
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
              <Avatar src={session?.user?.image} icon={<UserOutlined />} />
              <span>{session?.user?.name || '用户'}</span>
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

