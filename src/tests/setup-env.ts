// Loads .env into process.env for tests (Node 24 has no auto-dotenv for vitest workers).
import { existsSync, readFileSync } from 'node:fs'

for (const file of ['.env.local', '.env']) {
	if (!existsSync(file)) continue
	for (const line of readFileSync(file, 'utf8').split('\n')) {
		const match = /^([A-Za-z0-9_]+)=(.*)$/.exec(line.trim())
		if (match && !(match[1] in process.env)) {
			process.env[match[1]] = match[2]
		}
	}
}

export {}
