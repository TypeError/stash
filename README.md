# Satchel

Satchel is a Caido plugin for saving lightweight bookmarks to requests in HTTP History.

Satchel does not copy full request or response data into its own database. It stores the Caido request ID and a small display cache, then loads full request and response details from Caido when an item is opened.

## Scope

Satchel v1 supports:

- Add selected HTTP History requests from the context menu.
- View saved requests in a table.
- Load request and response details on demand.
- Delete one Satchel item.
- Clear all Satchel items.

Satchel v1 does not include replay, snapshots, export, tags, notes, folders, search, or bulk actions.

## Storage Model

Satchel stores only bookmark rows in the plugin SQLite database:

- `id`
- `caido_request_id`
- `method`
- `url`
- `host`
- `path`
- `created_at`
- `updated_at`

Caido HTTP History remains the source of truth for full request and response data. Deleting or clearing Satchel items does not delete anything from Caido HTTP History.

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

- `packages/frontend` contains the Satchel page, table, detail panel, commands, and menu registration.
- `packages/backend` contains API registration, SQLite storage, and Caido request detail loading.
- `packages/backend/src/satchel/satchelRepository.ts` owns Satchel SQL.
- `packages/backend/src/satchel/requestDetails.ts` loads full request and response details from Caido on demand.
