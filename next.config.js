/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['antd', '@ant-design/icons', '@ant-design/nextjs-registry'],
  output: 'standalone',
}

module.exports = nextConfig

