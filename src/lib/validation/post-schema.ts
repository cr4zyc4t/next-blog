import { z } from 'zod'

/**
 * Shared validation source of truth (data-model.md) — used by Server Actions and
 * rendered into inline field errors for the form (FR-010, FR-022, SC-006).
 */

export const TITLE_MAX = 200
export const DESCRIPTION_MAX = 500
export const BODY_MAX = 100_000
export const AUTHOR_NAME_MAX = 100

const publishTimeSchema = z
  .string()
  .transform((value, ctx) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid date and time' })
      return z.NEVER
    }
    const year = date.getUTCFullYear()
    if (year < 1970 || year > 2100) {
      ctx.addIssue({ code: 'custom', message: 'Year must be between 1970 and 2100' })
      return z.NEVER
    }
    return date
  })
  .nullable()

export const postInputSchema = z.object({
  id: z.uuid().optional(), // present = update path
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(TITLE_MAX, 'Title must be 200 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX, 'Description must be 500 characters or fewer')
    .default(''),
  body: z
    .string()
    .trim()
    .max(BODY_MAX, 'Body must be 100,000 characters or fewer')
    .default(''),
  authorName: z
    .string()
    .trim()
    .min(1, 'Author name is required')
    .max(AUTHOR_NAME_MAX, 'Author name must be 100 characters or fewer'),
  published: z.boolean({ error: 'Published state is required' }),
  publishTime: publishTimeSchema.optional().nullable(),
})

export type PostInput = z.input<typeof postInputSchema>
export type PostInputParsed = z.output<typeof postInputSchema>

export type FieldErrors = Record<string, string>

export function extractFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
