'use server'

import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { posts } from '@/db/schema'
import { resolvePublishTime } from '@/lib/posts/publish'
import { generateUniqueSlug } from '@/lib/slugify'
import { extractFieldErrors, postInputSchema, type FieldErrors, type PostInput } from '@/lib/validation/post-schema'

export type SaveResult = { ok: true; id: string; slug: string } | { ok: false; fieldErrors: FieldErrors }

/**
 * Server Action `savePost` (contracts): validate with Zod; on failure return
 * per-field errors and persist nothing (FR-010/022). On success persist (FR-011)
 * and return { ok, id, slug }. UPDATE path (slug regeneration) arrives with US3.
 */
export async function savePost(input: PostInput): Promise<SaveResult> {
  const parsed = postInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: extractFieldErrors(parsed.error) }
  }
  const d = parsed.data
  const publishTime = resolvePublishTime(d.published, d.publishTime ?? null, new Date())

  if (d.id) {
    // UPDATE path (FR-012, T038): regenerate slug from the (possibly new) title,
    // excluding this row's own slug from collision checking; bump updated_at.
    const all = await db.select({ id: posts.id, slug: posts.slug }).from(posts)
    const others = all.filter((r) => r.id !== d.id).map((r) => r.slug)
    const slug = generateUniqueSlug(d.title, others)
    const updated = await db
      .update(posts)
      .set({
        slug,
        title: d.title,
        description: d.description,
        body: d.body,
        authorName: d.authorName,
        published: d.published,
        publishTime,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, d.id))
      .returning({ id: posts.id, slug: posts.slug })
    if (updated.length === 0) {
      return { ok: false, fieldErrors: { form: 'Post no longer exists' } }
    }
    return { ok: true, id: updated[0].id, slug: updated[0].slug }
  }

  const existing = await db.select({ slug: posts.slug }).from(posts)
  const slug = generateUniqueSlug(d.title, existing.map((r) => r.slug))

  const inserted = await db
    .insert(posts)
    .values({
      slug,
      title: d.title,
      description: d.description,
      body: d.body,
      authorName: d.authorName,
      published: d.published,
      publishTime,
    })
    .returning({ id: posts.id, slug: posts.slug })

  return { ok: true, id: inserted[0].id, slug: inserted[0].slug }
}

export async function getPostForEditing(id: string) {
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1)
  const p = rows[0]
  if (!p) return null
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    body: p.body,
    authorName: p.authorName,
    published: p.published,
    publishTime: p.publishTime.toISOString(),
  }
}
