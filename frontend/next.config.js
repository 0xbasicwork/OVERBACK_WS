/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '45.76.10.9',
        port: '3000',
        pathname: '/**',
      },
    ],
  }
}

module.exports = nextConfig
