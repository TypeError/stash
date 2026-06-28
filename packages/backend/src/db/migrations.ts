import type { Database } from "sqlite";

import { migrateSatchelStorage } from "../satchel/satchelRepository";

export async function runMigrations(db: Database) {
  await migrateSatchelStorage(db);
}
