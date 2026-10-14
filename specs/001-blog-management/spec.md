# Feature Specification: Blog Post Management

**Feature Branch**: `001-blog-management`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "create specs for a blog application. for this phase we support a home page that list all published blogs, a page for create/edit/delete a blog. A blog will support some basic data like title, description, body, author, date, published. A WYSIWYG is expected to edit body, raw markdown is also supported. Author can also set publish time in the future"

## Clarifications

### Session 2026-10-14

- Q: Does this phase include a dedicated post-reading page linked from the home page list? → A: Yes — selecting a home-page entry opens a separate public page showing the full post (title, author, publish date, rendered body).
- Q: Should WYSIWYG and raw-markdown modes show and edit the same content in both directions? → A: Yes — one post body; each mode always presents an equivalent representation of the same content, editable in either mode.
- Q: How should the home page list behave as published posts grow? → A: Progressive loading via a "load more" button that appends older batches in newest-first order.
- Q: Against which clock is an author's entered future publish time interpreted? → A: The author's local time, converted once at save time to an exact instant.
- Q: What author authentication must this phase include to protect the management area? → A: No sign-in this phase — management pages are reachable only via an unlisted, private address not linked from the public site.
- Q: Does the public post address use an internal id or a title-derived slug? → A: Slug — unique, derived from the title, public URLs are `/posts/{slug}` (user directive during planning).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse published posts on the home page (Priority: P1)

A visitor opens the blog's home page and sees a list of all published blog posts, newest first. Each entry shows enough information (title, description, author, date) to decide whether to read it. Unpublished and not-yet-published posts never appear.

**Why this priority**: The home page is the blog's public face; without it there is nothing to read, so it is the minimum valuable output of the whole feature.

**Independent Test**: Create several posts with mixed states (published, unpublished, scheduled in the future) and confirm the home page lists only the published ones, ordered newest first — this works even if no other story is implemented.

**Acceptance Scenarios**:

1. **Given** two or more published posts exist, **When** a visitor opens the home page, **Then** all of them are listed, ordered so the most recently published appears first.
2. **Given** a post is saved as unpublished, **When** a visitor opens the home page, **Then** that post is not listed anywhere on the page.
3. **Given** a post is scheduled to publish at a future time, **When** a visitor opens the home page before that time, **Then** the post is not listed.
4. **Given** published posts exist, **When** a visitor views the home page, **Then** each listed entry shows the post's title, description, author name, and publication date.
5. **Given** a published post is listed on the home page, **When** a visitor selects it, **Then** a dedicated post page opens showing the full body with its formatting preserved.

---

### User Story 2 - Create a blog post (Priority: P1)

An author opens the post creation page, fills in title, description, and body, chooses whether the post is published, and saves it. The author can write the body either in a rich-text (WYSIWYG) editor or in raw markdown, switching between the two.

**Why this priority**: Without content creation there is no content to list; this story is the other half of the minimum viable product together with Story 1.

**Independent Test**: Create posts with valid and invalid data directly from the creation page and verify what is saved and shown — verifiable without editing, deleting, or scheduling features.

**Acceptance Scenarios**:

1. **Given** the author is on the creation page, **When** they enter a title, description, and body and save, **Then** the post is stored with those values plus the author, and it appears on the home page if published.
2. **Given** the author is writing the body, **When** they format text (e.g., headings, bold, lists) in the WYSIWYG editor, **Then** the formatting is preserved and rendered in the saved post.
3. **Given** the author is writing the body, **When** they switch to raw markdown mode and type markdown (e.g., `## Heading`, `**bold**`), **Then** the markdown is preserved and rendered in the saved post.
4. **Given** the author leaves the title empty, **When** they attempt to save, **Then** the post is not saved and a clear message explains that a title is required.
5. **Given** the author saves the post as unpublished, **When** they finish, **Then** the post is stored but does not appear on the home page.

---

### User Story 3 - Edit an existing blog post (Priority: P2)

An author opens an existing post in the same editing experience, changes any fields (title, description, body, published state), and saves. The changes take effect immediately for published posts.

**Why this priority**: Authoring inevitably requires correction after publication; high value but depends on posts already existing (Story 2).

**Independent Test**: Create a post, open it for editing, change fields and save, then verify the home page and the post reflect the changes — testable independently of delete and scheduling.

**Acceptance Scenarios**:

1. **Given** an existing post, **When** the author changes its title and body and saves, **Then** the updated values are stored and shown.
2. **Given** a published post, **When** the author switches it to unpublished and saves, **Then** it immediately disappears from the home page.
3. **Given** an unpublished post, **When** the author switches it to published and saves, **Then** it appears on the home page.

---

### User Story 4 - Schedule a post for future publication (Priority: P2)

While creating or editing, the author sets the publish time to a moment in the future and marks the post as published. The post stays hidden from the home page until that moment, then appears automatically without further author action.

**Why this priority**: Scheduled publishing is a headline capability of this phase, but it refines the publish state that Stories 1–3 already establish.

**Independent Test**: Create a post with a publish time a few minutes ahead, confirm it is absent before the time and appears after it — testable without editing or deleting existing posts.

**Acceptance Scenarios**:

1. **Given** the author sets a future date and time and publishes the post, **When** they save, **Then** the post does not appear on the home page until that time.
2. **Given** a scheduled post, **When** the current time reaches its scheduled publish time, **Then** the post appears on the home page automatically, ordered by its publish date.
3. **Given** a scheduled post whose time has not yet arrived, **When** the author changes the publish time to a later moment, **Then** the new time controls when the post appears.
4. **Given** the author enters a clearly invalid publish time (malformed date), **When** they save, **Then** the save is rejected with a clear error message.

---

### User Story 5 - Delete a blog post (Priority: P3)

An author removes a post they no longer want published. Deletion asks for confirmation before removing the post, and the post disappears from the home page and can no longer be opened.

**Why this priority**: Necessary for real content management but less frequent than creation and editing, and its absence does not block the core value.

**Independent Test**: Create a post, delete it via the confirmation flow, and confirm it is gone from the home page and no longer retrievable — testable once create exists.

**Acceptance Scenarios**:

1. **Given** an existing post, **When** the author chooses delete and confirms, **Then** the post is permanently removed and no longer appears on the home page.
2. **Given** an existing post, **When** the author chooses delete but cancels the confirmation, **Then** the post remains unchanged.

---

### Edge Cases

- **No posts yet**: The home page with zero published posts shows a friendly empty state rather than a blank page or error.
- **All posts already loaded**: Once every qualifying post is shown, the "load more" control is no longer shown or active.
- **Scheduling while unpublished**: An author sets a future publish time but leaves the post unpublished — the scheduled time is stored, but the post only becomes visible when both the publish flag is on and the time has passed.
- **Publish time moved from past to future on a live post**: Editing a live post to a future publish time removes it from the home page until the new time arrives.
- **Body left empty**: A post may be saved with an empty body (the author may be capturing a draft); only the title is mandatory.
- **Very long title or description**: Input limits are enforced with a clear message when exceeded, and listing layouts do not break on maximum-length values.
- **Mixed editor content**: Content authored in WYSIWYG mode is shown as equivalent markdown when the editor switches to raw markdown mode (and vice versa), with no data loss in either direction.
- **Scheduled post and time zone**: A publish time entered by the author is their local wall-clock time, converted once at save time into an exact instant; visibility is decided by that instant, so daylight shifts or viewer time zones never move a post's actual publication moment.
- **Two authors editing the same post** *(out of scope for this phase; last save wins — noted in Out of Scope / Assumptions)*.

## Requirements *(mandatory)*

### Functional Requirements

#### Home page (public)

- **FR-001**: System MUST show a home page listing blog posts to any visitor without sign-in.
- **FR-002**: System MUST include in the list only posts that are marked published AND whose publish time has arrived (publish time defaults to the moment of publication when not scheduled).
- **FR-003**: System MUST order the list by publish time, newest first.
- **FR-004**: Each list entry MUST show the post's title, description, author, and publish date.
- **FR-005**: System MUST open a dedicated public post page — at a unique, title-derived address (`/posts/{slug}`) — when a visitor selects a home-page entry, showing that post's title, author, publish date, and full rendered body.
- **FR-006**: System MUST show the home-page list in batches: an initial batch of the most recent published posts, plus a "load more" control that appends the next batch in the same newest-first order; the control MUST disappear once all qualifying posts are shown.
- **FR-007**: System MUST show a friendly empty state when no posts qualify for the list.

#### Blog post management (author)

- **FR-008**: System MUST expose post creation, editing, and deletion ONLY at management addresses that are unlisted — never linked, referenced, or discoverable from the public pages — so ordinary visitors have no path to these functions; this phase has no sign-in (see Assumptions).
- **FR-009**: System MUST let the author create a post with these fields: title (required), description, body, author name (defaults to the blog's configured author, editable per post), publish date/time, and published state.
- **FR-010**: System MUST reject saving a post without a title and show a clear validation message identifying the problem.
- **FR-011**: System MUST persist all post fields so they survive navigation, refresh, and restart.
- **FR-012**: System MUST let the author edit any existing post's fields, and changes MUST be reflected wherever the post is shown.
- **FR-013**: System MUST let the author delete a post, and MUST require an explicit confirmation before the deletion takes effect.
- **FR-014**: System MUST permanently remove a confirmed-deleted post from the home page and from the author's post list.

#### Body editing

- **FR-015**: System MUST provide a WYSIWYG (rich-text) editor for the body supporting at minimum: headings, bold, italic, links, ordered lists, and unordered lists.
- **FR-016**: System MUST let the author view and edit the same single post body as raw markdown instead of the WYSIWYG editor; each mode MUST always present an equivalent representation of that body (WYSIWYG content shown as markdown, markdown content shown as formatted text).
- **FR-017**: System MUST render the saved body on the post view with its formatting preserved, whether the author edited it in WYSIWYG or markdown mode.
- **FR-018**: Switching between WYSIWYG and raw markdown modes MUST NOT lose the post's existing content, and edits made in either mode MUST be reflected in the other.

#### Scheduled publishing

- **FR-019**: System MUST allow the author to set the publish date/time to a future moment when creating or editing a post; the entered time is interpreted in the author's local time and stored as a single exact instant.
- **FR-020**: System MUST keep a future-scheduled published post hidden from the home page until its publish time arrives, then MUST list it automatically with no author action.
- **FR-021**: System MUST accept past or present publish times and make such posts visible immediately when the post is published.
- **FR-022**: System MUST reject a malformed or nonsensical publish date with a clear validation message.

### Key Entities

- **Blog Post**: A single article. Attributes: title (required), URL slug (unique, derived from the title), description (short summary), body (formatted rich-text/markdown content), author, publish date/time, published state (published / not published). A post has exactly one author.
- **Author**: The content owner named on posts and used to manage them. In this phase, identified by a configurable display name (a blog default, overridable per post); no accounts or credentials exist yet.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor sees the initial batch of currently published posts (newest first) on the home page within 2 seconds of opening it, and each "load more" batch appears within 2 seconds, under a normal connection.
- **SC-002**: An author can create and publish a short post (title, description, a few formatted paragraphs) in under 3 minutes from opening the creation page.
- **SC-003**: A scheduled post appears on the home page within 1 minute of its scheduled publish time, with 100% of scheduled posts eventually becoming visible.
- **SC-004**: 0 unpublished or future-scheduled posts appear on the home page at any time.
- **SC-005**: Formatting created in the WYSIWYG editor or typed as markdown is fully preserved in 100% of saved posts (spot-checked across headings, emphasis, links, and lists).
- **SC-006**: Every invalid save attempt (missing title, bad publish date) is blocked with a message that lets a first-time author correct the problem without help — target: authors resolve validation errors unaided in all test sessions.
- **SC-007**: Editing or deleting a post takes effect on the home page immediately (next page load shows the change).

## Assumptions

- **No sign-in this phase**: Management is protected solely by unlisted, non-guessable addresses (FR-008); there is no authentication or authorization. This is an accepted limitation for this phase — anyone who learns a management address can modify content. Real author authentication (e.g., email + password accounts) is deferred to a later phase and MUST NOT be assumed here.
- **Single author persona**: One blog owner acts as "the author" for this phase; the author name shown on posts comes from a configurable default, overridable per post. No roles like editor/admin.
- **Public readability**: The home page and post reading require no sign-in and are anonymous.
- **Permanent delete**: Deletion is permanent for this phase (no trash/restore); the confirmation step is the safeguard.
- **Publish state model**: A post is either published or not. "Publish time" is the reference moment for visibility; if the author does not choose a time, the moment of publishing is used.
- **Content limits**: Title, description, and body lengths are bounded by generous practical limits (e.g., title ≤ 200 characters); exact limits are set at planning time.
- **Batch size**: The home page's initial and per-"load more" batch sizes are set at planning time (e.g., 10 posts per batch).
- **Concurrency**: Simultaneous edits of one post by multiple authors are rare in this phase; the last save wins, with no merge/conflict tooling.
- **No extras in this phase**: Comments, tags/categories, images/attachments, search, pagination beyond what is needed for the list, post previews, and analytics are out of scope.
- **Dependency**: None external in this phase — no sign-in, account, or third-party service is required; everything ships within the blog itself.
