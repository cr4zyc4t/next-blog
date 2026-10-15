'use client'

/**
 * FR-019 (T042): author enters a future publish moment in their own local
 * wall-clock (`datetime-local`); the browser converts it, and the value is
 * submitted as an exact UTC instant (research D8). Clearing the field means
 * "Publish now" — the server defaults publish_time to the moment of publishing.
 */
export function PublishControls({
  value,
  onChange,
  invalid,
  describedBy,
}: {
  value: string
  onChange: (value: string) => void
  /** T050 a11y: link the server-rendered date error to the field. */
  invalid?: boolean
  describedBy?: string
}) {
  return (
    <div className="publish-controls">
      <label htmlFor="publish-time">Publish at (local time)</label>
      <input
        id="publish-time"
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={60}
        aria-invalid={invalid || undefined}
        aria-describedby={[describedBy, 'publish-time-hint'].filter(Boolean).join(' ')}
      />
      <p className="hint" id="publish-time-hint">
        Leave empty to publish now. A future time schedules the post — it stays hidden
        until that moment.
      </p>
    </div>
  )
}

/** Convert a UTC ISO instant to the datetime-local wall-clock representation. */
export function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

/** Convert the datetime-local wall-clock value to an exact UTC instant. */
export function fromDatetimeLocal(value: string): string | null {
  if (!value) return null
  const instant = new Date(value) // browser interprets in the local zone (D8)
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString()
}
