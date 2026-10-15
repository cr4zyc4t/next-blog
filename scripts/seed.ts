/**
 * Dev/demo seed (quickstart scenarios 4, 7, 9): 12 published posts, 1 draft,
 * 1 scheduled +30 min. Truncates first so it is idempotent.
 * Run: `npm run db:seed` (loads .env via tsx --env-file in package.json).
 */
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { posts } from '../src/db/schema'
import { generateUniqueSlug } from '../src/lib/slugify'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

const body = (n: number) =>
	[
		`## Post ${n}`,
		'',
		`Body paragraph for **post ${n}** with *emphasis*.`,
		'',
		'- a bullet',
		'- another bullet',
		'',
		'[A link](https://example.com)',
	].join('\n')

async function main() {
	const pool = new Pool({ connectionString: url })
	const db = drizzle(pool)

	await db.delete(posts) // truncate (idempotent re-seed)

	const now = Date.now()
	const taken: string[] = []
	const rows = []

	for (let i = 1; i <= 12; i++) {
		const slug = generateUniqueSlug(`Seed post number ${i}`, taken)
		taken.push(slug)
		rows.push({
			slug,
			title: `Seed post number ${i}`,
			description: `Description for seed post ${i} — shown on the home page listing.`,
			body: body(i),
			authorName: process.env.AUTHOR_DEFAULT_NAME ?? 'Author',
			published: true,
			publishTime: new Date(now - i * 3_600_000), // hourly back in the past
		})
	}

	rows.push({
		slug: generateUniqueSlug('Draft seed post', taken),
		title: 'Draft seed post',
		description: 'Unpublished — must never appear on the home page.',
		body: body(13),
		authorName: 'Author',
		published: false,
		publishTime: new Date(now - 86_400_000),
	})

	rows.push({
		slug: generateUniqueSlug('Scheduled seed post', taken),
		title: 'Scheduled seed post',
		description: 'Published but scheduled +30 minutes — hidden until then.',
		body: body(14),
		authorName: 'Author',
		published: true,
		publishTime: new Date(now + 30 * 60_000),
	})

	await db.insert(posts).values(rows)
	console.log(`Seeded ${rows.length} posts (12 visible, 1 draft, 1 scheduled +30m)`)
	await pool.end()
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
