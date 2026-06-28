# Stash

Stash is a Caido plugin for keeping interesting HTTP History requests easy to find and reopen later.

It is intentionally small. Stash does not copy full request or response data into its own database. It stores the Caido request ID and a small display cache, then loads the full request and response from Caido when an item is opened.

## What It Does

Stash adds a lightweight bookmark workflow to Caido HTTP History.

Use it when you find a request worth returning to during testing, triage, review, or reporting.

Stash v1 supports:

- Stashing selected HTTP History requests from the context menu
- Viewing stashed requests in a dedicated table
- Opening a stashed request to load full request and response details
- Unstashing a single request
- Clearing the full stash
- Preserving stashed requests across reloads

## What It Does Not Do

Stash v1 is intentionally not a full case-management system.

It does not include:

- Replay
- Snapshots
- Export
- Tags
- Notes
- Folders
- Search
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

| Column             | Purpose                             |
| ------------------ | ----------------------------------- |
| `id`               | Internal Stash row ID               |
| `caido_request_id` | Caido HTTP History request ID       |
| `method`           | Cached display method               |
| `url`              | Cached display URL                  |
| `host`             | Cached display host                 |
| `path`             | Cached display path                 |
| `created_at`       | Time the request was stashed        |
| `updated_at`       | Time the Stash row was last updated |

Caido HTTP History remains the source of truth for full request and response data.

Unstashing a request or clearing the stash only removes Stash rows. It does not delete anything from Caido HTTP History.

## Project Structure

```txt
packages/
  backend/
    src/
      stash/
        requestDetails.ts
        stashRepository.ts
  frontend/
    src/
      views/
        stash/
```

### Backend

`packages/backend` contains the API registration, SQLite storage, and Caido request detail loading.

Important files:

- `packages/backend/src/stash/stashRepository.ts` owns Stash SQL.
- `packages/backend/src/stash/requestDetails.ts` loads full request and response details from Caido on demand.

### Frontend

`packages/frontend` contains the Stash page, table, detail panel, commands, and menu registration.

The frontend uses the Stash API to list lightweight cached rows first, then fetches full details only when the user opens a stashed request.

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
