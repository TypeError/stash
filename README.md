# Stash

Stash is a Caido plugin for saving lightweight saved requests to requests in HTTP History.

Stash does not copy full request or response data into its own database. It stores the Caido request ID and a small display cache, then loads full request and response details from Caido when an item is opened.

## Scope

Stash v1 supports:

- Add selected HTTP History requests from the context menu.
- View saved requests in a table.
- Load request and response details on demand.
- Delete one Stash item.
- Clear all Stash items.

Stash v1 does not include replay, snapshots, export, tags, notes, folders, search, or bulk actions.

## Storage Model

Stash stores only saved requests rows in the plugin SQLite database:

- `id`
- `caido_request_id`
- `method`
- `url`
- `host`
- `path`
- `created_at`
- `updated_at`

Caido HTTP History remains the source of truth for full request and response data. Deleting or clearing Stash items does not delete anything from Caido HTTP History.

## Development

This project uses Vite+.

```sh
vp install
vp dev
```

Useful checks:

```sh
vp check
vp run typecheck
vp run lint
vp run knip
vp run build
```

`vp test` is available through Vite+, but this repo currently does not have a working Vitest setup.

## Structure

- `packages/frontend` contains the Stash page, table, detail panel, commands, and menu registration.
- `packages/backend` contains API registration, SQLite storage, and Caido request detail loading.
- `packages/backend/src/stash/stashRepository.ts` owns Stash SQL.
- `packages/backend/src/stash/requestDetails.ts` loads full request and response details from Caido on demand.
