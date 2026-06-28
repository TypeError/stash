import type { SDK } from "caido:plugin";

import { runMigrations } from "./migrations";

export async function initDatabase(sdk: SDK) {
  const db = await sdk.meta.db();
  await runMigrations(db);
}
