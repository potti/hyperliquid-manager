'use client'

import { useState, useEffect } from 'react'
import { Modal, Checkbox, Space, message, Spin, Tag, Button } from 'antd'
import { collectionApi, tagEnumApi } from '@/lib/api-client'

interface TagEnum {
  id: string
  name: string
  description?: string
  color?: string
  is_system: boolean
  is_active: boolean
}

interface CollectionModalProps {
  visible: boolean
  address: string
  onClose: () => void
  onSuccess?: () => void
}

export default function CollectionModal({ visible, address, onClose, onSuccess }: CollectionModalProps) {
  const [loading, setLoading] = useState(false)
  const [tagEnums, setTagEnums] = useState<TagEnum[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [fetchingTags, setFetchingTags] = useState(false)
  const [fetchingCollection, setFetchingCollection] = useState(false)

  // 获取标签枚举列表
  const fetchTagEnums = async () => {
    setFetchingTags(true)
    try {
      const response = await tagEnumApi.getList()
      setTagEnums(response.tags || [])
    } catch (error: any) {
      message.error(`获取标签列表失败: ${error.message}`)
    } finally {
      setFetchingTags(false)
    }
  }

  // 获取当前地址的收藏信息
  const fetchCollection = async () => {
    if (!address) return
    
    setFetchingCollection(true)
    try {
      const response = await collectionApi.getByAddress(address)
      if (response.collection && response.collection.tags) {
        setSelectedTags(response.collection.tags || [])
      }
    } catch (error: any) {
      // 如果收藏不存在，清空选中状态
      if (error.code === 10004) {
        setSelectedTags([])
      }
    } finally {
      setFetchingCollection(false)
    }
  }

  // 当弹窗打开时，获取数据
  useEffect(() => {
    if (visible && address) {
      fetchTagEnums()
      fetchCollection()
    } else {
      setSelectedTags([])
    }
  }, [visible, address])

  // 处理保存
  const handleSave = async () => {
    setLoading(true)
    try {
      await collectionApi.createOrUpdate({
        address,
        tags: selectedTags,
      })
      message.success(selectedTags.length > 0 ? '收藏成功' : '地址已收藏（未添加标签）')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      message.error(`收藏失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 处理删除收藏
  const handleDelete = async () => {
    setLoading(true)
    try {
      await collectionApi.delete(address)
      message.success('已取消收藏')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      message.error(`取消收藏失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={
        <div>
          <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: 4 }}>
            收藏地址
          </div>
          <div style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>
            {address}
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      width={600}
      footer={[
        <Space key="footer" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button
            key="delete"
            danger
            onClick={handleDelete}
            disabled={loading}
          >
            取消收藏
          </Button>
          <Space>
            <Button key="cancel" onClick={onClose}>
              取消
            </Button>
            <Button
              key="submit"
              type="primary"
              onClick={handleSave}
              loading={loading}
            >
              保存
            </Button>
          </Space>
        </Space>,
      ]}
    >
      <Spin spinning={fetchingTags || fetchingCollection}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>
            选择标签（可多选，可选）:
            <span style={{ color: '#999', fontSize: '12px', fontWeight: 'normal', marginLeft: 8 }}>
              不选择标签也可以保存
            </span>
          </div>
          <Checkbox.Group
            value={selectedTags}
            onChange={(checkedValues) => setSelectedTags(checkedValues as string[])}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {tagEnums.length === 0 ? (
                <div style={{ color: '#999', padding: '20px 0', textAlign: 'center' }}>
                  {fetchingTags ? '加载中...' : '暂无标签，请先创建标签'}
                </div>
              ) : (
                tagEnums.map((tag) => (
                  <Checkbox key={tag.id} value={tag.id}>
                    <Space>
                      <Tag color={tag.color || '#1890ff'}>{tag.name}</Tag>
                      {tag.description && (
                        <span style={{ color: '#999', fontSize: '12px' }}>{tag.description}</span>
                      )}
                    </Space>
                  </Checkbox>
                ))
              )}
            </Space>
          </Checkbox.Group>
        </div>
      </Spin>
    </Modal>
  )
}

