/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['antd', '@ant-design/icons', '@ant-design/nextjs-registry'],
  output: 'standalone',
  // Explicitly expose environment variables to the browser
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

// Log environment variables during build (for debugging)
console.log('=== Next.js Build Environment ===')
console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '(not set)')
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || '(not set)')
console.log('=================================')

module.exports = nextConfig

