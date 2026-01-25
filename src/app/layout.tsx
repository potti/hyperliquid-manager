import type { Metadata } from 'next'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import { AuthProvider } from '@/contexts/AuthContext'
import { TabProvider } from '@/contexts/TabContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hyperliquid Manager',
  description: 'Hyperliquid管理后台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <TabProvider>
            <AntdRegistry>
              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: '#1890ff',
                  },
                }}
              >
                {children}
              </ConfigProvider>
            </AntdRegistry>
          </TabProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

