'use client'

import { Card, Table, Tag, Space, Button } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import DashboardLayout from '@/components/DashboardLayout'

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: '用户名',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => (
      <Tag color={status === 'active' ? 'green' : 'red'}>
        {status === 'active' ? '活跃' : '禁用'}
      </Tag>
    ),
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
  },
  {
    title: '操作',
    key: 'action',
    render: () => (
      <Space size="middle">
        <Button type="link" icon={<EditOutlined />}>编辑</Button>
        <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
      </Space>
    ),
  },
]

const data = [
  {
    key: '1',
    id: 1,
    name: '张三',
    email: 'zhangsan@example.com',
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    key: '2',
    id: 2,
    name: '李四',
    email: 'lisi@example.com',
    status: 'active',
    createdAt: '2024-01-16',
  },
  {
    key: '3',
    id: 3,
    name: '王五',
    email: 'wangwu@example.com',
    status: 'inactive',
    createdAt: '2024-01-17',
  },
]

export default function UsersPage() {
  return (
    <DashboardLayout>
      <Card
        title="用户管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            添加用户
          </Button>
        }
      >
        <Table columns={columns} dataSource={data} />
      </Card>
    </DashboardLayout>
  )
}

