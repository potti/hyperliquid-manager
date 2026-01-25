'use client'

import { useEffect, useState } from 'react'
import { Card, Table, Button, Space, message, Tag, Popconfirm, Tooltip } from 'antd'
import { ReloadOutlined, StarOutlined, StarFilled, DeleteOutlined } from '@ant-design/icons'
import CollectionModal from '@/components/collection/CollectionModal'
import { collectionApi, tagEnumApi } from '@/lib/api-client'
import type { ColumnsType } from 'antd/es/table'

// 收藏数据类型
interface AddressCollection {
  id: string
  user_uuid: string
  address: string
  tags: string[]
  created_at: number
  updated_at: number
}

// 标签信息映射
interface TagInfo {
  id: string
  name: string
  color?: string
}

export default function CollectionsPage() {
  const [loading, setLoading] = useState(false)
  const [collections, setCollections] = useState<AddressCollection[]>([])
  const [tagMap, setTagMap] = useState<Record<string, TagInfo>>({})
  const [collectionModalVisible, setCollectionModalVisible] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<string>('')

  // 获取标签映射
  const fetchTagMap = async () => {
    try {
      const response = await tagEnumApi.getList()
      const map: Record<string, TagInfo> = {}
      response.tags.forEach((tag) => {
        map[tag.id] = {
          id: tag.id,
          name: tag.name,
          color: tag.color,
        }
      })
      setTagMap(map)
    } catch (error: any) {
      console.error('获取标签列表失败:', error)
    }
  }

  // 获取收藏列表
  const fetchCollections = async () => {
    setLoading(true)
    try {
      const response = await collectionApi.getList()
      setCollections(response.collections || [])
    } catch (error: any) {
      message.error(`获取收藏列表失败: ${error.message}`)
      setCollections([])
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchTagMap()
    fetchCollections()
  }, [])

  // 格式化地址
  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // 处理编辑收藏
  const handleEditCollection = (address: string) => {
    setCurrentAddress(address)
    setCollectionModalVisible(true)
  }

  // 处理删除收藏
  const handleDeleteCollection = async (address: string) => {
    try {
      await collectionApi.delete(address)
      message.success('已取消收藏')
      fetchCollections()
    } catch (error: any) {
      message.error(`取消收藏失败: ${error.message}`)
    }
  }

  // 表格列配置
  const columns: ColumnsType<AddressCollection> = [
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 200,
      fixed: 'left',
      render: (text: string) => (
        <Tooltip title={text}>
          <span style={{ fontFamily: 'monospace', color: '#1890ff' }}>
            {formatAddress(text)}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 300,
      render: (tags: string[]) => {
        if (!tags || tags.length === 0) {
          return <span style={{ color: '#999' }}>无标签</span>
        }
        return (
          <Space wrap>
            {tags.map((tagId) => {
              const tagInfo = tagMap[tagId]
              if (!tagInfo) {
                return (
                  <Tag key={tagId} color="default">
                    未知标签
                  </Tag>
                )
              }
              return (
                <Tag key={tagId} color={tagInfo.color || '#1890ff'}>
                  {tagInfo.name}
                </Tag>
              )
            })}
          </Space>
        )
      },
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
      render: (_: any, record: AddressCollection) => (
        <Space>
          <Button
            type="link"
            icon={<StarFilled />}
            onClick={() => handleEditCollection(record.address)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要取消收藏吗？"
            onConfirm={() => handleDeleteCollection(record.address)}
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
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card
          title="收藏地址"
          extra={
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchTagMap()
                fetchCollections()
              }}
              loading={loading}
            >
              刷新
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={collections}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个收藏`,
            }}
            scroll={{ x: 1000 }}
            locale={{
              emptyText: '暂无收藏，快去发现页面收藏一些地址吧！',
            }}
          />
        </Card>

        {/* 收藏弹窗 */}
        <CollectionModal
          visible={collectionModalVisible}
          address={currentAddress}
          onClose={() => {
            setCollectionModalVisible(false)
            setCurrentAddress('')
          }}
          onSuccess={() => {
            fetchCollections()
          }}
        />
      </Space>
  )
}

