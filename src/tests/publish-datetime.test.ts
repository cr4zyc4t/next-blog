// T041 (FAIL FIRST — TDD): publish-datetime semantics (research D8, data-model rules).
import { describe, expect, it } from 'vitest'

import { parsePublishedDateTime, resolvePublishTime } from '@/lib/posts/publish'

const NOW = new Date('2026-10-14T12:00:00.000Z')

describe('parsePublishedDateTime (datetime-local → ISO instant, FR-019/022)', () => {
  it('parses a datetime-local string "2026-10-14T09:30" as an exact instant', () => {
    const parsed = parsePublishedDateTime('2026-10-14T09:30')
    expect(parsed).toBeInstanceOf(Date)
    expect(parsed!.toISOString()).toBe('2026-10-14T09:30:00.000Z') // treated as UTC wall-clock input
  })

  it('parses full ISO instants unchanged', () => {
    expect(parsePublishedDateTime('2026-10-14T09:30:00.000Z')?.toISOString()).toBe(
      '2026-10-14T09:30:00.000Z',
    )
  })

  it('rejects malformed values (FR-022)', () => {
    expect(parsePublishedDateTime('banana')).toBeNull()
    expect(parsePublishedDateTime('2026-13-40T99:99')).toBeNull()
  })

  it('rejects out-of-range years (nonsensical)', () => {
    expect(parsePublishedDateTime('1969-06-01T10:00')).toBeNull()
    expect(parsePublishedDateTime('2101-01-01T00:00')).toBeNull()
  })
})

describe('resolvePublishTime (publish semantics)', () => {
  it('published without a chosen time → exactly now (visible immediately, FR-021)', () => {
    expect(resolvePublishTime(true, null, NOW).getTime()).toBe(NOW.getTime())
  })

  it('published with a future instant → that instant (scheduled, FR-019/020)', () => {
    const future = new Date(NOW.getTime() + 60 * 60_000)
    expect(resolvePublishTime(true, future, NOW)).toEqual(future)
  })

  it('published with a past instant → that instant, visible immediately (FR-021)', () => {
    const past = new Date(NOW.getTime() - 60 * 60_000)
    expect(resolvePublishTime(true, past, NOW)).toEqual(past)
  })

  it('unpublished keeps the stored/scheduled instant if provided, else now', () => {
    const future = new Date(NOW.getTime() + 60 * 60_000)
    expect(resolvePublishTime(false, future, NOW)).toEqual(future)
    expect(resolvePublishTime(false, null, NOW).getTime()).toBe(NOW.getTime())
  })
})
