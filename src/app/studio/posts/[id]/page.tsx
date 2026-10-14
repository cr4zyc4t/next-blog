import { notFound } from 'next/navigation'

import { getPostForEditing } from '@/lib/actions/savePost'
import { PostForm } from '@/components/post-editor/PostForm'

export const dynamic = 'force-dynamic'

/**
 * Edit page (FR-012): id-keyed management URL (research D9), post prefills the
 * same PostForm. Last-save-wins — no conflict UI this phase (spec Assumption).
 */
export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const initial = await getPostForEditing(id)
  if (!initial) notFound()

  return (
    <section>
      <h1>Edit post</h1>
      <PostForm
        defaultAuthor={process.env.AUTHOR_DEFAULT_NAME ?? 'Author'}
        initial={{ ...initial, id: initial.id }}
      />
    </section>
  )
}
