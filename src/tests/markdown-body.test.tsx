// T015 (FAIL FIRST — TDD): "no raw HTML/script execution" + FR-017 formatting.
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MarkdownBody } from '@/components/markdown/MarkdownBody'

describe('MarkdownBody (contracts cross-cutting guarantees, FR-017)', () => {
	it('renders headings, bold, italic, lists, and links with formatting preserved', () => {
		render(
			<MarkdownBody
				source={
					'# Title\n\nSome **bold** and *italic* text.\n\n- one\n- two\n\n1. first\n2. second\n\n[a link](https://example.com)'
				}
			/>,
		)
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title')
		expect(screen.getByText('bold')).toBeInTheDocument()
		expect(screen.getByText('italic')).toBeInTheDocument()
		const items = [...document.querySelectorAll('li')]
		expect(items).toHaveLength(4)
		const link = screen.getByRole('link', { name: 'a link' })
		expect(link).toHaveAttribute('href', 'https://example.com')
	})

	it('strips raw <script> execution', () => {
		const { container } = render(
			<MarkdownBody source={'Hello\n\n<script>alert("xss")</script>\n\nWorld'} />,
		)
		expect(container.querySelector('script')).toBeNull()
		expect(screen.getByText(/Hello/)).toBeInTheDocument()
	})

	it('blocks javascript: URLs in links', () => {
		render(<MarkdownBody source={'[evil](javascript:alert(1))'} />)
		const link = document.querySelector('a')
		expect(link === null || !String(link.getAttribute('href')).startsWith('javascript:')).toBe(true)
	})

	it('drops event-handler attributes from raw HTML when present', () => {
		const evil = '<img src="x" onerror="alert(1)">'
		const { container } = render(<MarkdownBody source={evil} />)
		const img = container.querySelector('img')
		expect(img === null || !img.hasAttribute('onerror')).toBe(true)
	})
})
