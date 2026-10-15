import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'

/**
 * FR-015/016/018 (research D3): one canonical markdown body. The WYSIWYG
 * document and the raw markdown are two views of the same content — parse and
 * serialize via tiptap-markdown so switching modes is lossless.
 * Supported node set: headings h1–h3, bold, italic, links, ordered/unordered
 * lists, paragraphs.
 */
export function editorExtensions() {
	return [
		StarterKit.configure({
			heading: { levels: [1, 2, 3] },
			link: false, // StarterKit (Tiptap v3) bundles Link; keep the configured one below
		}),
		Link.configure({ openOnClick: false, autolink: true }),
		Markdown.configure({
			html: false, // markdown only — raw HTML never executes (matches MarkdownBody sanitization)
			tightLists: true,
			bulletListMarker: '-',
			transformPastedText: true,
			transformCopiedText: true,
		}),
	]
}

/** Typed accessor for tiptap-markdown storage (avoids `any` — Principle IV). */
export function getEditorMarkdown(editor: { storage: unknown }): string {
	const storage = editor.storage as { markdown?: { getMarkdown(): string } } | undefined
	return storage?.markdown?.getMarkdown() ?? ''
}

/** Headless parse → serialize (used by the round-trip guarantee tests, T027). */
export function markdownRoundTrip(markdown: string): string {
	const editor = new Editor({
		extensions: editorExtensions(),
		element: document.createElement('div'),
		content: markdown,
	})
	try {
		return getEditorMarkdown(editor)
	} finally {
		editor.destroy()
	}
}
