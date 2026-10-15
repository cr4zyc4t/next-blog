import type { NextConfig } from 'next'

const INTERNAL_STUDIO = '/studio'
const configuredStudio = process.env.STUDIO_BASE_PATH ?? INTERNAL_STUDIO

const nextConfig: NextConfig = {
	output: 'standalone', // Dockerfile (T005) copies .next/standalone
	async rewrites() {
		// Optional deployment rename of the unlisted management segment (research D6).
		if (configuredStudio === INTERNAL_STUDIO) return []
		return [{ source: `${configuredStudio}/:path*`, destination: `${INTERNAL_STUDIO}/:path*` }]
	},
}

export default nextConfig
