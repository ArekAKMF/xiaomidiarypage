/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'vercel.blob.core.windows.net',
      'ibqc9n0nj8chkrzs.public.blob.vercel-storage.com'
    ],
  },
}

module.exports = nextConfig 