'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { deletePost } from '@/lib/actions/deletePost'

/**
 * FR-013 (T047): "UI must confirm before invoking; cancel → no action" —
 * window.confirm is the explicit confirmation gate; only acceptance calls the
 * Server Action.
 */
export function ConfirmDelete({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const onClick = () => {
    if (!window.confirm(`Delete "${title}" permanently? This cannot be undone.`)) return
    startTransition(async () => {
      await deletePost(id)
      router.refresh()
    })
  }

  return (
    <button type="button" onClick={onClick} disabled={pending} aria-label={`Delete "${title}"`}>
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
