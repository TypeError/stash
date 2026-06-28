# Stash

Stash is a Caido plugin for keeping interesting HTTP History requests easy to find, review, and reopen later.

It is intentionally lightweight. Stash stores the Caido request ID, the HTTP History row ID when available, and a small display cache. Full request and response details are loaded from Caido only when needed. Caido HTTP History remains the source of truth.

## Motivation

I was watching [Becoming a Caido Power User](https://www.youtube.com/watch?v=_Y0oexpt-R8&t=389s), a talk by Justin Gardner from Bug Bounty Village at DEF CON 33, and saw his wishlist slide for a bookmarks plugin. As Caido has become a bigger part of my hacking workflow, this felt like the right challenge to take on given my work on the Burp Suite [Bookmarks](https://github.com/TypeError/Bookmarks) extension.

HTTP History moves fast during testing. Useful requests can get buried while you explore an application, validate behavior, triage findings, or prepare a report. Stash adds one focused loop for keeping track of requests worth returning to.

## What It Does

Stash adds a lightweight bookmark workflow to Caido HTTP History.

Use it when you find a request worth returning to during testing, triage, review, or reporting.

Stash v1 supports:

- Stashing selected HTTP History requests from the context menu
- Stashing requests from supported request and response contexts
- Stashing selected HTTP History requests from the command palette when rows are selected
- Opening the Stash page from the command palette or with `Alt+Shift+S`
- Searching stashed requests by ID, method, host, path, or URL
- Viewing stashed requests in a dedicated table
- Opening a stashed request to load full request and response details
- Sending a stashed request to Replay
- Showing stashed requests in HTTP History
- Unstashing a single request
- Clearing the full Stash
- Preserving stashed requests across reloads

## What It Does Not Do

Stash v1 is intentionally not a full case-management system.

It does not include:

- Tags
- Notes
- Folders
- Export
- Snapshots
- Bulk editing
- Request or response duplication

Those features may be useful later, but v1 focuses on one reliable loop:

1. Find an interesting request in HTTP History
2. Stash it
3. Return to it later
4. Open it when needed
5. Unstash it when done

## Storage Model

Stash stores lightweight rows in the plugin SQLite database.

| Column            | Purpose                             |
| ----------------- | ----------------------------------- |
| `id`              | Internal Stash row ID               |
| `request_id`      | Canonical Caido request ID          |
| `http_history_id` | HTTP History row ID, when available |
| `method`          | Cached display method               |
| `url`             | Cached display URL                  |
| `host`            | Cached display host                 |
| `path`            | Cached display path                 |
| `created_at`      | Time the request was stashed        |
| `updated_at`      | Time the Stash row was last updated |

The `request_id` is used for Caido request lookup, deduplication, and Replay. The `http_history_id` is used only for HTTP History UI behavior, such as showing stashed requests in HTTP History.

Stash does not store full request bodies or full response bodies. Full request and response content is loaded from Caido on demand.

Unstashing a request or clearing Stash only removes Stash rows. It does not remove anything from Caido HTTP History.

## Project Structure

```txt
packages/
  backend/
    src/
      api/
      db/
      stash/
  frontend/
    src/
      views/
        stash/
```

### Backend

`packages/backend` contains API registration, SQLite storage, migration logic, and Caido request detail loading.

Important files:

- `packages/backend/src/api/stashApi.ts` registers the backend API surface.
- `packages/backend/src/stash/stashRepository.ts` owns Stash SQL.
- `packages/backend/src/stash/requestDetails.ts` loads full request and response details from Caido on demand.

### Frontend

`packages/frontend` contains the Stash page, table, detail dialog, commands, and menu registration.

Important files:

- `packages/frontend/src/views/stash/StashView.vue` owns the page state and workflows.
- `packages/frontend/src/views/stash/StashTable.vue` renders the stashed request table.
- `packages/frontend/src/views/stash/StashDetailDialog.vue` shows request and response details loaded from Caido.
- `packages/frontend/src/views/stash/stash.commands.ts` registers commands and context menu entries.
- `packages/frontend/src/views/stash/stash.httpHistory.ts` handles HTTP History filtering.
- `packages/frontend/src/views/stash/stash.replay.ts` sends stashed requests to Replay.

The frontend lists lightweight cached rows first, then fetches full details only when the user opens a stashed request.

## Development

This project uses Vite+.

Install dependencies:

```sh
vp install
```

Start development:

```sh
vp dev
```

Run checks:

```sh
vp check
vp run typecheck
vp run lint
vp run knip
vp run build
```

`vp test` is available through Vite+, but this repo currently does not have a working Vitest setup.

## Feedback

Issues, ideas, and workflow feedback are welcome, especially from people using Caido for bug bounty, AppSec, security testing, or review workflows.

Stash is intentionally focused for v1, but practical feedback will help shape what should come next.
