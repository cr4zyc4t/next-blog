import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone', // Dockerfile (T005) copies .next/standalone
}

export default nextConfig
