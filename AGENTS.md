# AGENTS.md

## Purpose

Build and maintain this Caido plugin with simple, typed, maintainable code. Prefer direct use of the Caido SDK, small Vue components, and clear behavior over defensive abstractions.

## Tooling

This project uses Vite+, not plain Vite.

- Run `vp install` after pulling remote changes.
- Use `vp dev` for local development.
- Use `vp build` for production builds.
- Use `vp check` and `vp test` before committing meaningful changes.
- Run extra scripts through `vp run <script>` when needed.
- If tooling, runtime, or package behavior looks wrong, run `vp env doctor`.

For older template scripts, only use `pnpm lint` if the project still defines that workflow.

## Project Structure

Caido plugins are packaged through `caido.config.ts` and may include frontend and backend packages.

- `packages/frontend` contains UI, pages, commands, menus, and calls to backend APIs.
- `packages/backend` contains server-side logic, data processing, findings, and registered API functions.
- Keep code close to where it changes.
- Avoid large template blocks. Split complex UI into smaller components.
- Declare variables close to first use.
- Group related declarations near the code that uses them, such as event subscriptions next to lifecycle hooks.

## TypeScript Rules

- Use TypeScript for all source files.
- Use `type`, not `interface`.
- Do not use `any`.
- Do not cast to `any`.
- Prefer `undefined` over `null`.
- Do not add comments to generated code.
- Do not add unnecessary `try`/`catch`.
- Prefer clear names over explanatory comments.
- Use `computed` for derived Vue state when possible.
- Avoid alias-only types. Rename the type and fix references instead.
- Use `knip` to remove unused code during large refactors if it is available.
- Do not create an abstraction unless it removes real complexity.
- Avoid helper functions when a simple inline expression is clearer.

When checking nullable strings, handle empty and missing values explicitly instead of relying on broad falsy checks.

```ts
if (value !== undefined && value !== "") {
  renderValue(value);
}
```

## Naming

- Folders use camelCase, such as `httpHistory`.
- Component folders use PascalCase, such as `RequestBookmarkPanel`.
- Regular files use camelCase, such as `useBookmarks.ts`.
- Command IDs should be namespaced, such as `satchel.save-request`.

## Vue Components

Use Vue with `<script setup lang="ts">`.

Use PrimeVue components for UI controls and layout where possible.

Prefer this structure for components that need more than one file:

```text
ComponentName/
  index.ts
  Container.vue
  useForm.ts
  ChildComponent.vue
```

The public entry should re-export the main component.

```ts
export { default as ComponentName } from "./Container.vue";
```

Use the same nested structure for children only when the child grows enough to need it.

## Frontend SDK

Use the Caido frontend SDK for pages, sidebar items, commands, menus, toasts, editors, and backend API calls.

For plugins with a backend:

```ts
import { type Caido } from "@caido/sdk-frontend";
import { type API, type BackendEvents } from "backend";

export type FrontendSDK = Caido<API, BackendEvents>;
```

For frontend-only plugins:

```ts
import { type Caido } from "@caido/sdk-frontend";

export type FrontendSDK = Caido<Record<string, never>, Record<string, never>>;
```

Register commands once, use namespaced IDs, and expose important commands through the command palette or context menus when useful.

```ts
const Commands = {
  saveRequest: "satchel.save-request",
} as const;

sdk.commands.register(Commands.saveRequest, {
  name: "Save Request",
  group: "Satchel",
  run: () => saveCurrentRequest(),
});

sdk.commandPalette.register(Commands.saveRequest);
```

## Backend SDK

Use the Caido backend SDK for API endpoints, data processing, and findings.

```ts
import { type DefineAPI, type SDK } from "caido:plugin";

function getBookmarks(sdk: SDK) {
  sdk.console.log("Loading bookmarks");
  return [];
}

export type API = DefineAPI<{
  getBookmarks: typeof getBookmarks;
}>;

export function init(sdk: SDK<API>) {
  sdk.api.register("getBookmarks", getBookmarks);
}
```

Use backend events only when the frontend needs push-style updates.

```ts
import { type DefineEvents, type SDK } from "caido:plugin";

export type BackendEvents = DefineEvents<{
  "bookmarks-updated": { count: number };
}>;

export type CaidoBackendSDK = SDK<never, BackendEvents>;
```

## API Error Handling

Return typed results from backend APIs when failure is expected. Avoid throwing for normal user-facing errors.

```ts
export type Result<T> = { kind: "Ok"; value: T } | { kind: "Error"; error: string };
```

Frontend callers should branch on `kind` and show a toast for errors.

```ts
const result = await sdk.backend.saveBookmark(input);

if (result.kind === "Error") {
  sdk.window.showToast(result.error, { variant: "error" });
  return;
}

sdk.window.showToast("Bookmark saved", { variant: "success" });
```

Only use `try`/`catch` at boundaries where an operation can realistically fail and the error can be turned into a useful `Result`.

## SDK Validation

Use documented Caido SDK APIs directly. The SDK is typed.

Do not add runtime API existence checks.

```ts
sdk.window.showToast("Saved", { variant: "success" });

sdk.commands.register("satchel.save-request", {
  name: "Save Request",
  run: () => saveCurrentRequest(),
});
```

Do not do this:

```ts
if ("showToast" in sdk.window && typeof sdk.window.showToast === "function") {
  sdk.window.showToast("Saved");
}
```

If an SDK API is uncertain, inspect the installed types or documentation instead of guessing.

## Requests and Responses

Import HTTP types and helpers from `caido:utils`.

```ts
import { RequestSpec, type Request, type Response } from "caido:utils";
```

Use the SDK accessors rather than assuming object shapes.

```ts
const method = request.getMethod();
const url = request.getUrl();
const requestBody = request.getBody()?.toText();
const statusCode = response.getCode();
const responseBody = response.getBody()?.toText();
```

Use `RequestSpec` when creating or sending requests.

```ts
const spec = new RequestSpec("https://example.com/api");
spec.setMethod("POST");
spec.setHeader("Content-Type", "application/json");
spec.setBody(JSON.stringify({ enabled: true }));

const result = await sdk.requests.send(spec);
```

## Findings

Create Caido findings for notable traffic that should be visible outside the plugin UI.

```ts
await sdk.findings.create({
  title: `Interesting response ${response.getCode()}`,
  description: `Request ID: ${request.getId()}`,
  reporter: "Satchel",
  request,
  dedupeKey: `${request.getPath()}-${response.getCode()}`,
});
```

Always provide a stable `dedupeKey` when duplicate findings are possible.

## UI Guidelines

Use PrimeVue components for plugin UI. Match Caido’s dark theme instead of inventing a separate visual system.

- Prefer PrimeVue `Card`, `DataTable`, `Splitter`, and `SplitterPanel`.
- Use `DataTable` for structured lists.
- Put action columns at the end of tables.
- Use empty states with short, useful copy and an icon when it improves clarity.
- Use `fas fa-*` icons only.
- Prefer surface tokens such as `bg-surface-800`, `bg-surface-700`, and `border-surface-700`.
- Prefer built-in Tailwind values. Use dynamic values occasionally and globals rarely.
- Avoid unnecessary custom colors.
- Keep the UI minimal and consistent with Caido.

PrimeVue cards usually need named slots and `pt` overrides for full-height layouts.

```vue
<Card
  class="h-full"
  :pt="{
    body: { class: 'h-full p-0' },
    content: { class: 'h-full flex flex-col' },
  }"
>
  <template #content>
    <div class="flex-1">Content</div>
  </template>
</Card>
```

## Review Checklist

Before committing meaningful changes:

- [ ] Run `vp install` if dependencies may have changed.
- [ ] Run `vp check`.
- [ ] Run `vp test`.
- [ ] Run any relevant scripts with `vp run <script>`.
- [ ] Confirm no generated artifacts, secrets, local paths, or dependency folders were added.
- [ ] Confirm frontend and backend API types still line up.
- [ ] Confirm the UI still feels native to Caido.
