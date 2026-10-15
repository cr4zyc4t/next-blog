import { NextResponse, type NextRequest } from 'next/server'

/**
 * FR-008 (T017): the management area lives at `/studio`; every studio response
 * carries `X-Robots-Tag: noindex`, and no public page links to these paths
 * (enforced by tests/e2e/unlisted.spec.ts). The optional `STUDIO_BASE_PATH`
 * rename is handled by a rewrite in next.config.ts (matcher must stay static).
 */

const INTERNAL = '/studio'

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl
	const response = NextResponse.next()
	if (pathname === INTERNAL || pathname.startsWith(`${INTERNAL}/`)) {
		response.headers.set('x-robots-tag', 'noindex')
	}
	return response
}

export const config = {
	matcher: ['/studio', '/studio/:path*'],
}
