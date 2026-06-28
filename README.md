# Stash

Stash is a Caido plugin for bookmarking interesting HTTP History requests so they are easy to find, review, and reopen later.

HTTP History moves fast during testing. A useful request can get buried while you explore an app, validate behavior, chase a weird edge case, or prepare a report.

Stash gives you a simple loop:

1. Find something worth coming back to
2. Stash it
3. Keep testing
4. Reopen it when needed
5. Unstash it when done

## Why Use Stash?

Use Stash when a request is not ready for Replay, not ready for a report, and not something you want to lose.

Good candidates include:

- Suspicious auth behavior
- Interesting parameters
- Weird redirects
- Useful API endpoints
- Requests tied to a potential finding
- Setup requests needed for later testing
- Evidence you may want to review before reporting

Stash keeps those requests in one focused place without turning HTTP History into a second task list.

## Features

Stash v1 supports:

- Stashing HTTP History requests from context menus, supported request and response contexts, and the command palette
- Opening the Stash page from the command palette or with `Alt+Shift+S`
- Searching stashed requests by ID, method, host, path, or URL
- Viewing stashed requests in a dedicated table
- Opening a stashed request to load full request and response details
- Sending a stashed request to Replay
- Showing stashed requests in HTTP History
- Unstashing a single request
- Clearing the entire Stash
- Preserving stashed requests across reloads

## Built for Caido Workflows

Stash is designed to stay close to how Caido users already work.

You can stash requests from HTTP History, jump back to them from the Stash page, send them to Replay, or show them again in HTTP History when you need more context.

The goal is not to replace Replay, Findings, or HTTP History. The goal is to add a lightweight holding area for requests that deserve another look.

## How It Works

Stash keeps lightweight references to Caido HTTP History requests.

It stores the Caido request ID, the HTTP History row ID when available, and a small display cache for the table. Full request and response details are loaded from Caido only when you open a stashed request.

Caido HTTP History remains the source of truth. Unstashing a request or clearing Stash does not remove anything from Caido HTTP History.

## Motivation

The idea came from Justin Gardner’s [Becoming a Caido Power User](https://www.youtube.com/watch?v=_Y0oexpt-R8&t=389s) talk at Bug Bounty Village during DEF CON 33, where he called out a bookmarks plugin as part of his Caido wishlist.

That stuck with me. I had already built [Bookmarks](https://github.com/TypeError/Bookmarks) for Burp Suite, and Caido has become a bigger part of my own hacking workflow. Stash felt like the right Caido plugin to build first: small, practical, and directly tied to how testers move through HTTP History.

## Development

This project uses Vite+ for development.

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

Stash is intentionally focused for v1. Practical feedback will help shape what should come next.
