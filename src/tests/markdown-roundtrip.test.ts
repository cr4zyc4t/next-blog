// T027 (FAIL FIRST — TDD): contract guarantee "parse(serialize(doc)) ≡ doc"
// over the FR-015 node set (headings h1–h3, bold, italic, links, ordered/unordered lists, paragraphs).
import { describe, expect, it } from 'vitest'

import { markdownRoundTrip } from '@/lib/editor/serialization'

const SAMPLES: Array<[string, string]> = [
	['heading h1', '# Title'],
	['heading h2', '## Section'],
	['heading h3', '### Subsection'],
	['bold', '**strong text**'],
	['italic', '*emphasized text*'],
	['link', '[a link](https://example.com)'],
	['unordered list', '- one\n- two\n- three'],
	['ordered list', '1. first\n2. second'],
	['paragraphs', 'First paragraph.\n\nSecond paragraph.'],
	[
		'combined',
		'# Title\n\nSome **bold** and *italic* with a [link](https://example.com).\n\n- a\n- b\n\n1. x\n2. y',
	],
]

describe('markdown round-trip (FR-015/016/018, SC-005)', () => {
	for (const [name, md] of SAMPLES) {
		it(`round-trips: ${name}`, () => {
			const once = markdownRoundTrip(md)
			expect(once.trim()).toBe(md.trim())
		})
	}

	it('is idempotent (second pass is stable)', () => {
		const once = markdownRoundTrip(SAMPLES.at(-1)![1])
		expect(markdownRoundTrip(once)).toBe(once)
	})
})
