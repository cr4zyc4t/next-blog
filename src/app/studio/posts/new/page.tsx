import { PostForm } from '@/components/post-editor/PostForm'

export const dynamic = 'force-dynamic'

/** FR-008/009: unlisted creation page (T033). */
export default function NewPostPage() {
	return (
		<section>
			<h1>New post</h1>
			<PostForm defaultAuthor={process.env.AUTHOR_DEFAULT_NAME ?? 'Author'} />
		</section>
	)
}
