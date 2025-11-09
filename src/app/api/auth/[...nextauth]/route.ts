import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'

// 配置代理支持
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY

if (proxyUrl) {
  console.log('[NextAuth] 检测到代理配置:', proxyUrl)
  try {
    // 使用全局 agent 配置
    const { HttpsProxyAgent } = require('https-proxy-agent')
    const agent = new HttpsProxyAgent(proxyUrl)
    
    // 配置全局 HTTPS agent
    const https = require('https')
    https.globalAgent = agent
    
    console.log('[NextAuth] 代理配置成功')
  } catch (error) {
    console.warn('[NextAuth] 代理配置失败:', error instanceof Error ? error.message : error)
    console.warn('[NextAuth] 请确保已安装: npm install https-proxy-agent')
  }
} else {
  console.log('[NextAuth] 未检测到代理配置 (HTTP_PROXY/HTTPS_PROXY)')
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

