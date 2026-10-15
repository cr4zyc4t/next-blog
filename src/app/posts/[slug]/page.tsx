import Link from 'next/link'
import { notFound } from 'next/navigation'

import { MarkdownBody } from '@/components/markdown/MarkdownBody'
import { db } from '@/db/client'
import { getVisibleBySlug } from '@/lib/posts/queries'

// Visibility is evaluated per request (SC-004, SC-003).
export const dynamic = 'force-dynamic'

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const post = await getVisibleBySlug(db, slug)
	if (!post) notFound()

	return (
		<main className="public-shell">
			<article className="post-full">
				<header>
					<h1>{post.title}</h1>
					<p className="post-meta">
						<span className="post-author">{post.authorName}</span>{' '}
						<time dateTime={post.publishTime.toISOString()}>
							{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(post.publishTime)}
						</time>
					</p>
				</header>
				<MarkdownBody source={post.body} />
			</article>
			<p>
				<Link href="/">← All posts</Link>
			</p>
		</main>
	)
}
