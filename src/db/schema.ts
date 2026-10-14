import { sql } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

/**
 * Single table for the whole feature (data-model.md):
 * Visibility is never stored — it is computed at query time as
 * `published = true AND publish_time <= now()` (research D4).
 */
export const posts = pgTable(
  'posts',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`), // Postgres 18 native uuidv7 (time-ordered — research D9)
    slug: varchar('slug', { length: 220 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    description: varchar('description', { length: 500 }).notNull().default(''),
    body: text('body').notNull().default(''), // canonical markdown (research D3)
    authorName: varchar('author_name', { length: 100 }).notNull(),
    published: boolean('published').notNull().default(false),
    publishTime: timestamp('publish_time', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_posts_visible').on(t.published, t.publishTime), // supports the visibility query + keyset batches (D4/D5)
    uniqueIndex('uq_posts_slug').on(t.slug), // public lookups (D9)
  ],
)

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
