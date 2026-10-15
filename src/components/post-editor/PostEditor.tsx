'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useState } from 'react'

import { editorExtensions, getEditorMarkdown } from '@/lib/editor/serialization'

/**
 * FR-015/016/018: one body value; WYSIWYG (Tiptap) and raw-markdown textarea
 * are two views of it. The saved value is always markdown text. Toggling never
 * loses content: the markdown view shows the serialized document; edits typed
 * in markdown re-parse into the document on switch (contract T030).
 */
export function PostEditor({
	initialMarkdown,
	onChange,
}: {
	initialMarkdown: string
	onChange: (markdown: string) => void
}) {
	const [mode, setMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg')
	const [markdownText, setMarkdownText] = useState(initialMarkdown)

	const editor = useEditor({
		extensions: editorExtensions(),
		content: initialMarkdown,
		immediatelyRender: false, // SSR hydration-safe (Next App Router)
		editorProps: { attributes: { 'aria-label': 'Body (rich text)' } },
		onUpdate: ({ editor: e }) => {
			const md = getEditorMarkdown(e)
			setMarkdownText(md)
			onChange(md)
		},
	})

	const switchTo = (next: 'wysiwyg' | 'markdown') => {
		if (next === mode || !editor) return
		if (next === 'wysiwyg') {
			// markdown → document: re-parse the raw text; onUpdate re-syncs the value
			editor.commands.setContent(markdownText)
		}
		setMode(next)
	}

	if (!editor) return null

	return (
		<div className="post-editor">
			<div className="editor-toolbar" role="toolbar" aria-label="Formatting">
				<button
					type="button"
					aria-label="Bold"
					onClick={() => editor.chain().focus().toggleBold().run()}
				>
					Bold
				</button>
				<button
					type="button"
					aria-label="Italic"
					onClick={() => editor.chain().focus().toggleItalic().run()}
				>
					Italic
				</button>
				<button
					type="button"
					aria-label="Heading 2"
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				>
					Heading 2
				</button>
				<button
					type="button"
					aria-label="Bulleted list"
					onClick={() => editor.chain().focus().toggleBulletList().run()}
				>
					Bulleted list
				</button>
				<button
					type="button"
					aria-label="Numbered list"
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
				>
					Numbered list
				</button>
				<button
					type="button"
					aria-label="Link"
					onClick={() => {
						const url = window.prompt('Link URL')
						if (url) editor.chain().focus().setLink({ href: url }).run()
					}}
				>
					Link
				</button>
				<span className="editor-mode-switch">
					<button
						type="button"
						aria-pressed={mode === 'wysiwyg'}
						onClick={() => switchTo('wysiwyg')}
					>
						Rich text
					</button>
					<button
						type="button"
						aria-pressed={mode === 'markdown'}
						onClick={() => switchTo('markdown')}
					>
						Markdown
					</button>
				</span>
			</div>

			<div style={{ display: mode === 'wysiwyg' ? 'block' : 'none' }}>
				<EditorContent editor={editor} />
			</div>
			{mode === 'markdown' ? (
				<textarea
					aria-label="Body (markdown)"
					rows={12}
					value={markdownText}
					onChange={(e) => {
						setMarkdownText(e.target.value)
						onChange(e.target.value)
					}}
				/>
			) : null}
		</div>
	)
}
