'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { savePost } from '@/lib/actions/savePost'
import type { FieldErrors } from '@/lib/validation/post-schema'
import { PostEditor } from './PostEditor'
import { fromDatetimeLocal, PublishControls, toDatetimeLocal } from './PublishControls'

export type PostFormValues = {
  id?: string
  title: string
  description: string
  body: string
  authorName: string
  published: boolean
  publishTime?: string | null
}

/** FR-009/010: form fields with defaults and inline server-rendered errors. */
export function PostForm({
  defaultAuthor,
  initial,
}: {
  defaultAuthor: string
  initial?: PostFormValues
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [publishLocal, setPublishLocal] = useState(toDatetimeLocal(initial?.publishTime))
  const [values, setValues] = useState<PostFormValues>(
    initial ?? {
      title: '',
      description: '',
      body: '',
      authorName: defaultAuthor,
      published: false,
      publishTime: null,
    },
  )

  const set = (key: keyof PostFormValues) => (value: string | boolean) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    startTransition(async () => {
      const result = await savePost({
        id: values.id,
        title: values.title,
        description: values.description,
        body: values.body,
        authorName: values.authorName,
        published: values.published,
        publishTime: fromDatetimeLocal(publishLocal),
      })
      if (result.ok) {
        router.push('/studio/posts')
        router.refresh()
      } else {
        setFieldErrors(result.fieldErrors)
      }
    })
  }

  // T050 a11y: inline errors are announced (role="alert") and associated with
  // their control (aria-describedby/aria-invalid) — SC-006 unaided correction.
  const errorId = (key: string) => `${key}-error`
  const error = (key: string) =>
    fieldErrors[key] ? (
      <p id={errorId(key)} role="alert" className="field-error">
        {fieldErrors[key]}
      </p>
    ) : null
  const invalidProps = (key: string) =>
    fieldErrors[key]
      ? { 'aria-invalid': true as const, 'aria-describedby': errorId(key) }
      : {}

  return (
    <form onSubmit={onSubmit} className="post-form">
      <label htmlFor="post-title">Title</label>
      <input
        id="post-title"
        value={values.title}
        onChange={(e) => set('title')(e.target.value)}
        maxLength={200}
        {...invalidProps('title')}
      />
      {error('title')}

      <label htmlFor="post-description">Description</label>
      <textarea
        id="post-description"
        rows={2}
        value={values.description}
        onChange={(e) => set('description')(e.target.value)}
        maxLength={500}
        {...invalidProps('description')}
      />
      {error('description')}

      <label htmlFor="post-author">Author name</label>
      <input
        id="post-author"
        value={values.authorName}
        onChange={(e) => set('authorName')(e.target.value)}
        maxLength={100}
        {...invalidProps('authorName')}
      />
      {error('authorName')}

      <label htmlFor="post-published" className="published-toggle">
        <input
          id="post-published"
          type="checkbox"
          checked={values.published}
          onChange={(e) => set('published')(e.target.checked)}
        />
        Published
      </label>

      <PublishControls
        value={publishLocal}
        onChange={setPublishLocal}
        invalid={!!fieldErrors.publishTime}
        describedBy={fieldErrors.publishTime ? errorId('publishTime') : undefined}
      />
      {error('publishTime')}

      <fieldset {...(fieldErrors.body ? { 'aria-describedby': errorId('body') } : {})}>
        <legend>Body</legend>
        <PostEditor initialMarkdown={values.body} onChange={(md) => set('body')(md)} />
      </fieldset>
      {error('body')}

      <button type="submit" disabled={pending} aria-label="Save post">
        {pending ? 'Saving…' : 'Save post'}
      </button>
      {fieldErrors.form ? (
        <p role="alert" className="field-error">
          {fieldErrors.form}
        </p>
      ) : null}
    </form>
  )
}
