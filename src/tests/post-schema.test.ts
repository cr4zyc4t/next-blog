// T011 (FAIL FIRST — TDD): validation rules quoted verbatim from data-model.md.
import { describe, expect, it } from 'vitest'

import { postInputSchema } from '@/lib/validation/post-schema'

const valid = {
  title: 'Hello',
  description: 'A summary',
  body: '# Hi',
  authorName: 'Author',
  published: true,
  publishTime: '2026-10-14T10:00:00.000Z',
}

describe('postInputSchema (data-model.md validation rules)', () => {
  it('accepts a fully valid create input', () => {
    const parsed = postInputSchema.parse(valid)
    expect(parsed.title).toBe('Hello')
    expect(parsed.publishTime).toBeInstanceOf(Date)
  })

  it('title: required, trimmed length 1–200 → "Title is required"', () => {
    const res = postInputSchema.safeParse({ ...valid, title: '   ' })
    expect(res.success).toBe(false)
    expect(res.error.issues.find((i) => i.path[0] === 'title')?.message).toBe('Title is required')
  })

  it('title → "Title must be 200 characters or fewer"', () => {
    const res = postInputSchema.safeParse({ ...valid, title: 'a'.repeat(201) })
    expect(res.success).toBe(false)
    expect(res.error.issues.find((i) => i.path[0] === 'title')?.message).toBe(
      'Title must be 200 characters or fewer',
    )
  })

  it('title is trimmed on success', () => {
    expect(postInputSchema.parse({ ...valid, title: '  Padded  ' }).title).toBe('Padded')
  })

  it('description: ≤ 500 chars', () => {
    expect(postInputSchema.safeParse({ ...valid, description: 'd'.repeat(501) }).success).toBe(
      false,
    )
    expect(postInputSchema.safeParse({ ...valid, description: 'd'.repeat(500) }).success).toBe(true)
  })

  it('body: ≤ 100,000 chars, empty allowed (draft-friendly)', () => {
    expect(postInputSchema.safeParse({ ...valid, body: '' }).success).toBe(true)
    expect(postInputSchema.safeParse({ ...valid, body: 'b'.repeat(100_001) }).success).toBe(false)
  })

  it('authorName: required, 1–100 chars', () => {
    expect(postInputSchema.safeParse({ ...valid, authorName: '' }).success).toBe(false)
    expect(postInputSchema.safeParse({ ...valid, authorName: 'a'.repeat(101) }).success).toBe(false)
  })

  it('publishTime: malformed instant → field error (FR-022)', () => {
    const res = postInputSchema.safeParse({ ...valid, publishTime: 'banana' })
    expect(res.success).toBe(false)
    expect(res.error.issues.some((i) => i.path[0] === 'publishTime')).toBe(true)
  })

  it('publishTime: year 1970–2100 range enforced (nonsensical rejected)', () => {
    expect(postInputSchema.safeParse({ ...valid, publishTime: '1969-01-01T00:00:00Z' }).success)
      .toBe(false)
    expect(postInputSchema.safeParse({ ...valid, publishTime: '2101-01-01T00:00:00Z' }).success)
      .toBe(false)
  })

  it('publishTime optional (defaults handled at service layer)', () => {
    const res = postInputSchema.safeParse({ ...valid, publishTime: null })
    expect(res.success).toBe(true)
  })

  it('published is a required boolean', () => {
    expect(postInputSchema.safeParse({ ...valid, published: undefined }).success).toBe(false)
  })
})
