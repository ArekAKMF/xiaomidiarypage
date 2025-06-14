/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['vercel.blob.core.windows.net'],
  },
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig 