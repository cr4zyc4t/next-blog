import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
	robots: { index: false, follow: false },
}

/**
 * Unlisted management shell (FR-008). Never linked from public pages.
 * No auth this phase — an accepted limitation (spec Assumptions).
 */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
	return (
		<main className="studio-root" data-studio="true">
			<header className="studio-header">
				<span className="studio-badge">Studio (unlisted)</span>
				<nav aria-label="Studio">
					<Link href="/studio/posts">Posts</Link>
					<Link href="/studio/posts/new">New post</Link>
				</nav>
			</header>
			<div className="studio-body">{children}</div>
		</main>
	)
}
