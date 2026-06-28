import type { Database } from "sqlite";

import { migrateStashStorage } from "../stash/stashRepository";

export async function runMigrations(db: Database) {
  await migrateStashStorage(db);
}
