import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
    backendToken?: string
    backendUser?: {
      id: string
      uuid: string
      email: string
      name: string
    }
  }
}

