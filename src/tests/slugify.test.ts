// T009 (FAIL FIRST — TDD, constitution Principle II): slug generation per research D9.
import { describe, expect, it } from 'vitest'

import { generateUniqueSlug, slugify } from '@/lib/slugify'

describe('slugify (research D9)', () => {
  it('lowercases and replaces non-alphanumerics with single hyphens', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })

  it('collapses runs of non-alphanumerics into one hyphen', () => {
    expect(slugify('a -- b!!c')).toBe('a-b-c')
  })

  it('trims leading/trailing non-alphanumerics and whitespace', () => {
    expect(slugify('  !!hi!!  ')).toBe('hi')
    expect(slugify('   spaced   ')).toBe('spaced')
  })

  it('ASCII-folds diacritics', () => {
    expect(slugify('À ÉÍ Ôõ')).toBe('a-ei-oo')
  })

  it('keeps digits', () => {
    expect(slugify('Top 10 Tips 2026')).toBe('top-10-tips-2026')
  })

  it('caps length at 200 without a trailing hyphen', () => {
    const long = 'a'.repeat(250)
    const out = slugify(long)
    expect(out.length).toBeLessThanOrEqual(200)
    expect(out).toBe('a'.repeat(200))
    expect(slugify(`${'word '.repeat(50)}@@@`)).toMatch(/[^-]$/)
  })

  it('returns empty string when nothing ASCII-alphanumeric remains', () => {
    expect(slugify('日本語 --- !!!')).toBe('')
  })
})

describe('generateUniqueSlug (collision suffixes per research D9)', () => {
  it('uses the plain slug when free', () => {
    expect(generateUniqueSlug('Hello World', [])).toBe('hello-world')
  })

  it('appends -2 then -3 on collision', () => {
    expect(generateUniqueSlug('Hello World', ['hello-world'])).toBe('hello-world-2')
    expect(generateUniqueSlug('Hello World', ['hello-world', 'hello-world-2'])).toBe(
      'hello-world-3',
    )
  })

  it('falls back to "post" base when the title slugifies to empty', () => {
    expect(generateUniqueSlug('日本語', [])).toBe('post')
    expect(generateUniqueSlug('日本語', ['post'])).toBe('post-2')
  })

  it('regenerates from a new title (no sticky slug)', () => {
    expect(generateUniqueSlug('New Title', ['old-title'])).toBe('new-title')
  })

  it('stays within the 220-char column cap', () => {
    const out = generateUniqueSlug('w '.repeat(150), [])
    expect(out.length).toBeLessThanOrEqual(220)
  })
})
