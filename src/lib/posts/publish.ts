/**
 * Publish-time semantics (research D8, FR-019/020/021, data-model rules).
 * The client converts the datetime-local wall-clock to an exact UTC instant
 * before submit; the server re-validates. A bare (timezone-less) string is
 * interpreted as UTC so results never depend on server-local time.
 */

export const MIN_YEAR = 1970
export const MAX_YEAR = 2100

/** Parse an instant string; returns null when malformed or nonsensical (FR-022). */
export function parsePublishedDateTime(value: string): Date | null {
  const iso = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const year = date.getUTCFullYear()
  if (year < MIN_YEAR || year > MAX_YEAR) return null
  return date
}

/**
 * Resolve the stored publish_time on save (FR-019/020/021 + spec Assumption
 * "publish time defaults to the moment of publication when not scheduled").
 */
export function resolvePublishTime(
  published: boolean,
  chosen: Date | null,
  now: Date,
): Date {
  return chosen ?? now
}
