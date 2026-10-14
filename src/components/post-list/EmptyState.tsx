/** FR-007: friendly empty state instead of a blank page. */
export function EmptyState() {
  return (
    <section className="empty-state" data-testid="empty-state">
      <h2>No posts yet</h2>
      <p>Nothing has been published so far. Check back soon!</p>
    </section>
  )
}
