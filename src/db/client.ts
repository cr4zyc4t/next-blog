import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

// T053 fix: importing this module MUST NOT throw — `next build` imports route
// modules during page-data collection, before runtime env is present. The
// DATABASE_URL misconfiguration error MUST still surface clearly at first query.
const CONFIG_ERROR = 'DATABASE_URL is not set (see .env.example)'

// Reuse the pool across Next.js dev hot reloads.
const globalForDb = globalThis as unknown as { pool?: Pool }
let modulePool: Pool | undefined

function getPool(): Pool {
	const url = process.env.DATABASE_URL
	if (!url) throw new Error(CONFIG_ERROR)
	if (process.env.NODE_ENV === 'production') {
		modulePool ??= new Pool({ connectionString: url })
		return modulePool
	}
	globalForDb.pool ??= new Pool({ connectionString: url })
	return globalForDb.pool
}

// Properties drizzle uses to actually talk to Postgres; everything else
// (constructor introspection, `in` probes, instanceof checks) must stay inert
// at construction/build time.
const CLIENT_API_PROPS = new Set(['connect', 'query', 'end'])

// Deferred client: drizzle stores this reference at construction and only
// touches the pool when a query executes, so the pool is created on first use.
// The target is a Pool.prototype shell so drizzle's client-vs-config
// introspection (constructor.name, `in` probes, instanceof) sees a pg Pool.
const deferredTarget = Object.create(Pool.prototype) as Pool

const deferredPool = new Proxy(deferredTarget, {
	get(_target, prop) {
		if (!process.env.DATABASE_URL) {
			if (typeof prop === 'string' && CLIENT_API_PROPS.has(prop)) {
				throw new Error(CONFIG_ERROR)
			}
			return Reflect.get(_target, prop, _target) // inert while unconfigured
		}
		const real = getPool()
		const value = Reflect.get(real, prop, real)
		return typeof value === 'function' ? value.bind(real) : value
	},
})

export const db = drizzle(deferredPool, { schema })
