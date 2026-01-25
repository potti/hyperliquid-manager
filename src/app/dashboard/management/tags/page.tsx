'use client'

import { useEffect, useState } from 'react'
import { Card, Table, Button, Space, message, Tag, Popconfirm, Modal, Form, Input, Switch, ColorPicker } from 'antd'
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { tagEnumApi } from '@/lib/api-client'
import type { ColumnsType } from 'antd/es/table'

// 标签数据类型
interface TagEnum {
  id: string
  name: string
  description?: string
  color?: string
  is_system: boolean
  is_active: boolean
  created_at?: number
  updated_at?: number
}

// 标签表单数据类型
interface TagFormData {
  name: string
  description?: string
  color?: string
  is_active?: boolean
}

export default function TagManagementPage() {
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<TagEnum[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTag, setEditingTag] = useState<TagEnum | null>(null)
  const [form] = Form.useForm()

  // 获取标签列表
  const fetchTags = async () => {
    setLoading(true)
    try {
      const response = await tagEnumApi.getList()
      setTags(response.tags || [])
    } catch (error: any) {
      message.error(`获取标签列表失败: ${error.message}`)
      setTags([])
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchTags()
  }, [])

  // 处理新增标签
  const handleAdd = () => {
    setEditingTag(null)
    form.resetFields()
    form.setFieldsValue({ is_active: true })
    setModalVisible(true)
  }

  // 处理编辑标签
  const handleEdit = (tag: TagEnum) => {
    setEditingTag(tag)
    form.setFieldsValue({
      name: tag.name,
      description: tag.description || '',
      color: tag.color || '#1890ff',
      is_active: tag.is_active,
    })
    setModalVisible(true)
  }

  // 处理保存标签
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      // 处理颜色值：ColorPicker 可能返回字符串或对象
      let colorValue = values.color
      if (colorValue && typeof colorValue !== 'string') {
        // 如果是 Color 对象，转换为 hex 字符串
        if (colorValue.toHexString) {
          colorValue = colorValue.toHexString()
        } else if (colorValue.toHex) {
          colorValue = colorValue.toHex()
        }
      }
      
      const formData: TagFormData = {
        name: values.name,
        description: values.description || undefined,
        color: colorValue || '#1890ff',
        is_active: values.is_active,
      }

      if (editingTag) {
        // 更新标签
        await tagEnumApi.update(editingTag.id, formData)
        message.success('标签更新成功')
      } else {
        // 创建标签
        await tagEnumApi.create(formData)
        message.success('标签创建成功')
      }

      setModalVisible(false)
      form.resetFields()
      fetchTags()
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误
        return
      }
      message.error(`保存失败: ${error.message}`)
    }
  }

  // 处理删除标签
  const handleDelete = async (tag: TagEnum) => {
    if (tag.is_system) {
      message.warning('系统标签不能删除')
      return
    }

    try {
      // 通过设置 is_active 为 false 来"删除"标签
      await tagEnumApi.update(tag.id, { is_active: false })
      message.success('标签已删除')
      fetchTags()
    } catch (error: any) {
      message.error(`删除失败: ${error.message}`)
    }
  }

  // 处理启用/禁用标签
  const handleToggleActive = async (tag: TagEnum) => {
    try {
      await tagEnumApi.update(tag.id, { is_active: !tag.is_active })
      message.success(tag.is_active ? '标签已禁用' : '标签已启用')
      fetchTags()
    } catch (error: any) {
      message.error(`操作失败: ${error.message}`)
    }
  }

  // 表格列配置
  const columns: ColumnsType<TagEnum> = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text: string, record: TagEnum) => (
        <Space>
          <Tag color={record.color || '#1890ff'}>{text}</Tag>
          {record.is_system && (
            <Tag color="orange">系统</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (text: string) => text || <span style={{ color: '#999' }}>--</span>,
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (color: string) => (
        <Space>
          <div
            style={{
              width: 20,
              height: 20,
              backgroundColor: color || '#1890ff',
              borderRadius: 4,
              border: '1px solid #d9d9d9',
            }}
          />
          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {color || '#1890ff'}
          </span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean, record: TagEnum) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleActive(record)}
          disabled={record.is_system}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (timestamp: number) => {
        if (!timestamp) return '--'
        return new Date(timestamp * 1000).toLocaleString('zh-CN')
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (timestamp: number) => {
        if (!timestamp) return '--'
        return new Date(timestamp * 1000).toLocaleString('zh-CN')
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: TagEnum) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {!record.is_system && (
            <Popconfirm
              title="确定要删除这个标签吗？"
              description="删除后标签将不可用，但已使用该标签的收藏不会受影响。"
              onConfirm={() => handleDelete(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card
          title="标签管理"
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchTags}
                loading={loading}
              >
                刷新
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                新增标签
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={tags}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个标签`,
            }}
            scroll={{ x: 1000 }}
            locale={{
              emptyText: '暂无标签，点击"新增标签"创建第一个标签',
            }}
          />
        </Card>

        {/* 新增/编辑标签弹窗 */}
        <Modal
          title={editingTag ? '编辑标签' : '新增标签'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            form.resetFields()
            setEditingTag(null)
          }}
          onOk={handleSave}
          okText="保存"
          cancelText="取消"
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              is_active: true,
              color: '#1890ff',
            }}
          >
            <Form.Item
              name="name"
              label="标签名称"
              rules={[
                { required: true, message: '请输入标签名称' },
                { min: 1, max: 50, message: '标签名称长度应在1-50个字符之间' },
              ]}
            >
              <Input placeholder="请输入标签名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
              rules={[
                { max: 200, message: '描述长度不能超过200个字符' },
              ]}
            >
              <Input.TextArea
                placeholder="请输入标签描述（可选）"
                rows={3}
                showCount
                maxLength={200}
              />
            </Form.Item>

            <Form.Item
              name="color"
              label="颜色"
              rules={[
                { required: true, message: '请选择标签颜色' },
              ]}
            >
              <ColorPicker
                showText
                format="hex"
                presets={[
                  {
                    label: '推荐颜色',
                    colors: [
                      '#1890ff',
                      '#52c41a',
                      '#faad14',
                      '#f5222d',
                      '#722ed1',
                      '#13c2c2',
                      '#eb2f96',
                      '#fa8c16',
                    ],
                  },
                ]}
              />
            </Form.Item>

            {editingTag && (
              <Form.Item
                name="is_active"
                label="状态"
                valuePropName="checked"
              >
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            )}
          </Form>
        </Modal>
      </Space>
  )
}

