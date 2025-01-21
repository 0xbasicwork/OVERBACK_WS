/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '45.76.10.9',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.overback.io',
        port: '',
        pathname: '/**',
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : 'http://localhost:3001/api/:path*'
      }
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone'
}

module.exports = nextConfig
