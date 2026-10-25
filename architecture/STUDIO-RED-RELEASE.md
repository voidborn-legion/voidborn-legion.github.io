# Red Studio and editable website — 25 October 2026

The existing VitePress website and Vue/Tiptap Studio share the user-approved ember-red Voidborn identity. The original rich editor, guide/image IDs, comments, tasks and Git history remain in place. Imported content is not published by this technical release.

## Shared editing

`data/site.json` holds homepage text, image, primary navigation and footer. The shared `site.mjs` validator restricts links to internal paths/HTTPS and images to the public image directory. `site.save` and `site.image` are draft-only transactions with expected-head checks. Existing image signature and 2 MiB checks also apply to homepage images. Guide-scoped grants cannot edit global site settings.

Studio starts with a searchable contribution list. It compares immutable document blobs against `main`, with a publication receipt for content whose status metadata changes during publication. This is explicitly a publication-branch comparison, not a claim that the Pages build has succeeded. GitHub Actions remains the build authority.

`guide.submit` records a saved draft for review. Editing text or replacing an image clears the request. Comments do not change guide content. Completed requests are omitted from the queue when their exact draft version has been published.

## Publication

Authenticated Studio HTTP `/api/publish` is separate from draft commands. It requires `content.publish`, global scope, and exact expected draft and main heads. Only administrators receive publishing by default. It copies only the selected active guide or website configuration and referenced image blobs, strips the review-request metadata, writes a receipt and performs a non-force CAS-compatible main update. Pending factual review remains pending. Markdown links to unpublished guides block the release. GitHub builds the new website; on build failure the previously deployed website remains live.

This first release does not unpublish or delete public content when a Studio record is archived. It also does not publish editorial bundles, feedback, tasks, other drafts, code or credentials. Existing GitHub files remain public independently of Studio permissions.

## Users and plugin

The new user panel uses the existing protected grant service and preserves advanced overrides/scopes when changing a role. It supports GitHub numeric account IDs, role templates and suspension. Discord/email login and invitations are not implemented.

The same remote MCP endpoint now advertises 41 tools, adding read/save website settings, homepage-image import, guide submission and publication-branch status. The plugin remains draft-only; it has no publishing tool. Plugin version 0.4.0 preserves the existing App identity, OAuth connection, audience, prompts and retained resources.

## Verification

The 46-test suite passed, covering editing, image bytes, OAuth refresh, permissions, conflicts, site settings and review invalidation. Additional focused tests cover selective publication, non-force ref updates, exclusion of feedback/unrelated drafts and blocking unpublished links. Public/Studio release builds and model validation are required before deployment. Local browser save tests use a separate `draft/studio-redesign-preview` branch initialized from the imported draft revision, never the canonical Studio branch.
