/**
 * Slug generation per research D9: lowercase, ASCII-folded, non-alphanumerics →
 * single `-`, capped at 200 chars, uniqueness suffix `-2`/`-3` on collision,
 * regenerated from the title on every save (management stays id-keyed).
 */

const BASE_MAX = 200 // data-model: slug column varchar(220); headroom left for `-N` suffixes
const FALLBACK_BASE = 'post'

export function slugify(title: string): string {
	return title
		.normalize('NFKD') // decompose diacritics (é → e + combining mark)
		.replace(/[\u0300-\u036f]/g, '') // drop combining marks — ASCII fold
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-') // non-alphanumerics → single hyphen runs
		.replace(/^-+|-+$/g, '') // trim
		.slice(0, BASE_MAX)
		.replace(/-+$/g, '') // no trailing hyphen after truncation
}

export function generateUniqueSlug(title: string, taken: string[]): string {
	const base = slugify(title) || FALLBACK_BASE
	if (!taken.includes(base)) return base
	for (let n = 2; ; n++) {
		const withSuffix = `${base}-${n}`
		if (!taken.includes(withSuffix)) return withSuffix
	}
}
