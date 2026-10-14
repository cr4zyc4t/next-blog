import { PostListItemView } from './PostListItemView'
import type { PostListItemDto } from '@/lib/posts/types'

export function PostList({ items }: { items: PostListItemDto[] }) {
  return (
    <ul className="post-list" aria-label="Published posts" data-testid="post-list">
      {items.map((item) => (
        <li key={item.id}>
          <PostListItemView item={item} />
        </li>
      ))}
    </ul>
  )
}
