// Test-DB harness (T014): creates/migrates DATABASE_URL_TEST and truncates between runs.
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

import * as schema from '@/db/schema'

export type DbHandle = {
	db: NodePgDatabase<typeof schema>
	reset: () => Promise<void>
	close: () => Promise<void>
}

const TEST_URL = process.env.DATABASE_URL_TEST

function maintenanceUrl(url: string): string {
	const u = new URL(url)
	u.pathname = '/postgres'
	return u.toString()
}

export async function createTestDb(): Promise<DbHandle> {
	if (!TEST_URL) throw new Error('DATABASE_URL_TEST is not set (see .env.example)')

	// Ensure the test database exists (idempotent).
	const admin = new Pool({ connectionString: maintenanceUrl(TEST_URL) })
	const dbName = new URL(TEST_URL).pathname.slice(1)
	const existing = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
	if (existing.rowCount === 0) {
		if (!/^[a-z_][a-z0-9_]*$/i.test(dbName)) throw new Error(`unsafe test db name: ${dbName}`)
		await admin.query(`CREATE DATABASE "${dbName}"`)
	}
	await admin.end()

	const pool = new Pool({ connectionString: TEST_URL })
	const db = drizzle(pool, { schema })
	await migrate(db, { migrationsFolder: 'src/db/migrations' })

	return {
		db,
		reset: async () => {
			await pool.query('TRUNCATE TABLE "posts"')
		},
		close: async () => {
			await pool.end()
		},
	}
}
