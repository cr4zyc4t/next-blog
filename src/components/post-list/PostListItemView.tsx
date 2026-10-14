import type { PostListItemDto } from '@/lib/posts/types'

/** One home-page entry: title link, description, author, publish date (FR-004). */
export function PostListItemView({ item }: { item: PostListItemDto }) {
  const date = new Date(item.publishTime)
  return (
    <article>
      <h2>
        <a href={`/posts/${item.slug}`}>{item.title}</a>
      </h2>
      {item.description ? <p className="post-description">{item.description}</p> : null}
      <p className="post-meta">
        <span className="post-author">{item.authorName}</span>{' '}
        <time dateTime={item.publishTime}>
          {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)}
        </time>
      </p>
    </article>
  )
}
