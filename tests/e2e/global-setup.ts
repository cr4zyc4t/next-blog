import { execSync } from 'node:child_process'

/**
 * E2E global setup: seed the dev DB deterministically (T016 script) and warm
 * the first-compile of `/` so SC-001 timing assertions measure served time,
 * not dev-server compile time. Runs after playwright's webServer is ready.
 */
export default async function globalSetup() {
  execSync('npm run db:seed', { stdio: 'inherit' })
  await fetch('http://localhost:3000/', { cache: 'no-store' })
  await fetch('http://localhost:3000/posts/seed-post-number-1', { cache: 'no-store' })
}
