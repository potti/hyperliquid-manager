'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, Form, Input, Button, Switch, Space, message } from 'antd'
import DashboardLayout from '@/components/DashboardLayout'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [form] = Form.useForm()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const onFinish = (values: any) => {
    console.log('Success:', values)
    message.success('设置已保存！')
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <DashboardLayout>
      <Card title="系统设置">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            siteName: 'Hyperliquid Manager',
            siteDescription: '管理后台系统',
            enableNotifications: true,
            enableEmails: true,
          }}
        >
          <Form.Item
            label="站点名称"
            name="siteName"
            rules={[{ required: true, message: '请输入站点名称' }]}
          >
            <Input placeholder="请输入站点名称" />
          </Form.Item>

          <Form.Item
            label="站点描述"
            name="siteDescription"
          >
            <Input.TextArea rows={4} placeholder="请输入站点描述" />
          </Form.Item>

          <Form.Item
            label="启用通知"
            name="enableNotifications"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="启用邮件"
            name="enableEmails"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存设置
              </Button>
              <Button htmlType="reset">
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </DashboardLayout>
  )
}

