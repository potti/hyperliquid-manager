/**
 * API 客户端工具
 * 用于与后端 API 通信，自动处理认证和错误
 */

import { getSession } from 'next-auth/react'

// 后端 API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

/**
 * API 响应类型
 */
interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: number,
    message: string,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 通用 API 客户端
 * @param endpoint API 端点（相对路径，如 '/api/users'）
 * @param options fetch 选项
 * @returns 响应数据
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // 获取当前 session
    const session = await getSession()

    // 构建请求头
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // 如果有 session，添加 Authorization header
    if (session?.user) {
      // 这里可以使用不同的认证方式
      // 方式 1: 使用 NextAuth 的 access token
      if ((session as any).accessToken) {
        headers['Authorization'] = `Bearer ${(session as any).accessToken}`
      }
      // 方式 2: 使用用户 ID 或 email
      else {
        headers['X-User-Email'] = session.user.email || ''
        headers['X-User-ID'] = session.user.id || ''
      }
    }

    // 发起请求
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    // 解析响应
    const data: ApiResponse<T> = await response.json()

    // 处理 HTTP 错误
    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.code || response.status,
        data.message || response.statusText,
        data.data
      )
    }

    // 处理业务错误
    if (data.code !== 0 && data.code !== 200) {
      throw new ApiError(response.status, data.code, data.message, data.data)
    }

    return data.data
  } catch (error) {
    // 如果是 ApiError，直接抛出
    if (error instanceof ApiError) {
      throw error
    }

    // 网络错误或其他错误
    if (error instanceof Error) {
      throw new ApiError(0, 0, error.message)
    }

    throw new ApiError(0, 0, 'Unknown error occurred')
  }
}

/**
 * GET 请求
 */
export async function get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = params
    ? `${endpoint}?${new URLSearchParams(params).toString()}`
    : endpoint

  return apiClient<T>(url, { method: 'GET' })
}

/**
 * POST 请求
 */
export async function post<T = any>(endpoint: string, data?: any): Promise<T> {
  return apiClient<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * PUT 请求
 */
export async function put<T = any>(endpoint: string, data?: any): Promise<T> {
  return apiClient<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * DELETE 请求
 */
export async function del<T = any>(endpoint: string): Promise<T> {
  return apiClient<T>(endpoint, { method: 'DELETE' })
}

/**
 * 文件上传
 */
export async function upload<T = any>(endpoint: string, file: File): Promise<T> {
  const session = await getSession()
  const formData = new FormData()
  formData.append('file', file)

  const headers: HeadersInit = {}
  if (session?.user) {
    if ((session as any).accessToken) {
      headers['Authorization'] = `Bearer ${(session as any).accessToken}`
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  const data: ApiResponse<T> = await response.json()

  if (!response.ok || (data.code !== 0 && data.code !== 200)) {
    throw new ApiError(
      response.status,
      data.code || response.status,
      data.message || response.statusText
    )
  }

  return data.data
}

// ============= 业务 API 封装 =============

/**
 * 用户相关 API
 */
export const userApi = {
  // 获取用户列表
  getList: (params?: { page?: number; size?: number; keyword?: string }) =>
    get('/api/users', params),

  // 获取用户详情
  getDetail: (id: string) => get(`/api/users/${id}`),

  // 创建用户
  create: (data: any) => post('/api/users', data),

  // 更新用户
  update: (id: string, data: any) => put(`/api/users/${id}`, data),

  // 删除用户
  delete: (id: string) => del(`/api/users/${id}`),
}

/**
 * 系统设置相关 API
 */
export const settingsApi = {
  // 获取系统设置
  get: () => get('/api/settings'),

  // 更新系统设置
  update: (data: any) => put('/api/settings', data),
}

/**
 * 统计数据 API
 */
export const statsApi = {
  // 获取仪表盘统计数据
  getDashboard: () => get('/api/stats/dashboard'),
}

