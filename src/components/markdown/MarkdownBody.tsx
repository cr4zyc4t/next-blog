import Markdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

/**
 * Server-safe markdown renderer for public pages (research D3):
 * canonical markdown → formatted DOM with sanitization — required because this
 * phase has no author auth, so body content is never trusted ("no raw
 * HTML/script execution", contracts Cross-cutting guarantees).
 */
export function MarkdownBody({ source }: { source: string }) {
	return (
		<div data-testid="markdown-body" className="markdown-body">
			<Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
				{source}
			</Markdown>
		</div>
	)
}
