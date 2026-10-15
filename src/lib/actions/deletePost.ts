'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/db/client'
import { posts } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * FR-013/014 (T046): delete is permanent this phase (spec Assumption — the
 * confirmation dialog is the safeguard). Revalidates public and studio lists.
 */
export async function deletePost(id: string): Promise<{ ok: boolean }> {
	if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false }
	await db.delete(posts).where(eq(posts.id, id))
	revalidatePath('/')
	revalidatePath('/studio/posts')
	return { ok: true }
}
