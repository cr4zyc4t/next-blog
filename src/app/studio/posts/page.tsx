import Link from 'next/link'

import { ConfirmDelete } from '@/components/post-list/ConfirmDelete'
import { db } from '@/db/client'
import { listAllForStudio } from '@/lib/posts/queries'

export const dynamic = 'force-dynamic'

function stateLabel(published: boolean, publishTime: Date): string {
	if (!published) return 'draft'
	return publishTime.getTime() > Date.now() ? 'scheduled' : 'live'
}

/** Studio post list — ALL posts any state, newest updated_at first (data-model contract 4). */
export default async function StudioPostsPage() {
	const rows = await listAllForStudio(db)

	return (
		<section>
			<h1>Posts</h1>
			<p>
				<Link href="/studio/posts/new">New post</Link>
			</p>
			<div className="studio-posts-list" data-testid="studio-posts">
				{rows.map((post) => (
					<article key={post.id}>
						<strong>{post.title}</strong>{' '}
						<span className="state-badge">{stateLabel(post.published, post.publishTime)}</span>
						<p className="post-meta">
							{post.authorName} · updated{' '}
							{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(post.updatedAt)}
						</p>
						<p>
							<Link href={`/studio/posts/${post.id}`}>Edit</Link>{' '}
							<ConfirmDelete id={post.id} title={post.title} />
						</p>
					</article>
				))}
			</div>
		</section>
	)
}
