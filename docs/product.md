# Product

## What this is

A personal, single-author blog. Anyone can read it; the owner writes. Posts are written
in markdown (through a rich-text editor), can be published immediately or scheduled for a
future moment, and appear on the home page newest-first.

There is **no account system yet**. The author reaches the writing area through a private,
unlisted address that is never linked from the public site. This is a deliberate,
accepted limitation of the current phase (see [decisions.md](decisions.md) D4).

## Who it's for

- **Visitors** — anonymous readers. They see the home page and individual post pages.
- **The author** — one person (you). They create, edit, schedule, and delete posts
  through the unlisted "studio" area.

## Capabilities and acceptance

Each capability below is verified by an automated end-to-end scenario
(see [development.md](development.md)).

### 1. Browsing published posts (home page)

- The home page lists posts to any visitor, no sign-in.
- Only posts that are *published* **and** whose publish time has arrived appear —
  drafts and not-yet-due scheduled posts are never listed.
- The list is ordered newest publish time first.
- Each entry shows title, description, author name, and publish date.
- Posts load in batches of 10: an initial batch, then a "load more" button appends the
  next 10; the button disappears once everything is shown.
- With no published posts, the page shows a friendly "No posts yet" state — never a
  blank page or an error.

### 2. Reading a post

- Each post has a public page at `/posts/<slug>` (a unique slug derived from the title).
- The page shows title, author, publish date, and the full formatted body
  (headings, bold/italic, links, lists all render).
- Drafts and not-yet-due scheduled posts return **404 at their direct URL too** — they
  are unreachable even by link.
- Body content is sanitized on render: no raw HTML or scripts can execute.

### 3. Creating a post (studio)

- Form fields: title (required), description, author name (pre-filled from a configured
  default, editable per post), publish date/time, published on/off, and the body.
- The body has two editing modes over **one** body of content: a WYSIWYG editor and a
  raw-markdown editor. Switching either way shows the equivalent content; editing in
  either mode is reflected in the other; nothing is lost on switch.
- Invalid input is rejected with a clear message next to the field (e.g. saving without
  a title shows "Title is required"); nothing is stored on a failed save.
- A saved-as-draft post is stored but stays off the home page.

### 4. Editing a post

- Every field can be changed; changes show up on the home page and post page on the
  next load.
- Flipping published off hides a post immediately; flipping it on publishes it
  (immediately if its time has passed).
- Renaming a post regenerates its slug; the old URL then 404s.

### 5. Scheduling

- The author picks a publish date/time in their own local clock; it is stored as one
  exact instant, so time zones and daylight saving never shift when a post goes live.
- A scheduled post stays hidden (and 404s directly) until its moment, then appears on
  the home page automatically — within one minute, no author action required.
- Pushing the publish time later re-hides the post until the new moment.
- A nonsensical date is rejected with a field error.

### 6. Deleting a post

- Deleting asks for an explicit confirmation ("Delete \"…\" permanently? This cannot be
  undone."). Cancelling does nothing.
- Confirmed deletion is permanent: the post disappears from home, from the studio list,
  and its URL 404s. There is no trash/restore in this phase.

## Measurable behavior goals

- Home page's first batch and every "load more" batch appear within 2 seconds under a
  normal connection.
- A scheduled post becomes visible within 1 minute of its publish time, every time.
- Zero drafts or not-yet-due scheduled posts ever appear on the home page.
- Formatting authored in either editor mode survives 100% of saves.
- A first-time author can fix any validation error without help.

## Explicit non-goals (current phase)

Sign-in and accounts, multiple authors/roles, comments, tags or categories, image
uploads, search, post previews, analytics, and multi-device editing conflict handling
(concurrent edits: last save wins).
