import { execSync } from 'node:child_process'

/** Re-seed the dev DB before each spec file (specs mutate shared rows). */
export function seedFresh() {
	execSync('npm run db:seed', { stdio: 'inherit' })
}
