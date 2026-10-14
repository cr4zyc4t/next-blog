'use server'

import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { posts } from '@/db/schema'
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

  if (d.id) {
    return { ok: false, fieldErrors: { form: 'Editing arrives with the edit story' } }
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
      ...(d.publishTime ? { publishTime: d.publishTime } : {}), // else DB default now()
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
