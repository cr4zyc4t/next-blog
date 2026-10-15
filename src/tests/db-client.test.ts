import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * T053 fix (TDD): `next build` imports route modules during page-data
 * collection, so importing `src/db/client.ts` MUST NOT throw even when
 * DATABASE_URL is unset (it is injected at container runtime). The misconfig
 * error MUST still surface clearly at first query.
 */
describe('db client import safety (build-time vs runtime env)', () => {
	const repoRoot = path.resolve(__dirname, '..', '..')

	const runWithoutDatabaseUrl = (): { stdout: string; stderr: string; failed: boolean } => {
		const clientPath = path.join(repoRoot, 'src', 'db', 'client.ts')
		const script = [
			'(async () => {',
			'  delete process.env.DATABASE_URL;',
			`  const m = await import(${JSON.stringify('file://' + clientPath)});`,
			"  console.log('IMPORT_OK');",
			"  const { sql } = await import('drizzle-orm');",
			'  try {',
			'    await m.db.execute(sql`select 1`);',
			"    console.log('QUERY_UNEXPECTEDLY_SUCCEEDED');",
			'  } catch (e) {',
			'    console.error(String(e && e.message));',
			'    if (e && e.cause) console.error(String(e.cause.message));',
			'    process.exit(1);',
			'  }',
			'})().catch((e) => { console.error(String(e && e.stack)); process.exit(2); });',
		].join('\n')

		const env = { ...process.env }
		delete env.DATABASE_URL
		try {
			const stdout = execFileSync('npx', ['tsx', '-e', script], {
				cwd: repoRoot,
				env,
				encoding: 'utf8',
				stdio: ['ignore', 'pipe', 'pipe'],
			})
			return { stdout, stderr: '', failed: false }
		} catch (err) {
			const e = err as { stdout?: string; stderr?: string }
			return { stdout: e.stdout ?? '', stderr: e.stderr ?? '', failed: true }
		}
	}

	it('importing src/db/client.ts does not throw without DATABASE_URL', () => {
		const { stdout } = runWithoutDatabaseUrl()
		expect(stdout).toContain('IMPORT_OK')
	})

	it('the first query without DATABASE_URL fails with the config error message', () => {
		const { stdout, stderr, failed } = runWithoutDatabaseUrl()
		expect(failed).toBe(true)
		expect(stdout).toContain('IMPORT_OK')
		expect(stdout + stderr).toContain('DATABASE_URL is not set')
	})
})
