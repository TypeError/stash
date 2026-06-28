import type { Database, Parameter } from "sqlite";

import type { NewSatchelBookmark, SatchelBookmarkRow } from "./satchelTypes";

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readRequiredString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readRequiredNumber(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function nullableParameter(value: string | null): Parameter {
  return value === null ? null : value;
}

function mapBookmarkRow(row: Record<string, unknown>): SatchelBookmarkRow {
  return {
    id: readRequiredNumber(row.id),
    caidoRequestId: readRequiredString(row.caidoRequestId),
    method: readString(row.method),
    url: readString(row.url),
    host: readString(row.host),
    path: readString(row.path),
    createdAt: readRequiredString(row.createdAt),
    updatedAt: readRequiredString(row.updatedAt),
  };
}

async function getTableColumns(db: Database, tableName: string): Promise<string[]> {
  const stmt = await db.prepare(`PRAGMA table_info(${tableName})`);
  const rows = await stmt.all<Record<string, unknown>>();
  return rows.map((row) => readRequiredString(row.name));
}

async function createSatchelItemsTable(db: Database, tableName: string) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      caido_request_id TEXT NOT NULL UNIQUE,
      method TEXT,
      url TEXT,
      host TEXT,
      path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

export async function migrateSatchelStorage(db: Database) {
  const columns = await getTableColumns(db, "satchel_items");
  const expectedColumns = [
    "id",
    "caido_request_id",
    "method",
    "url",
    "host",
    "path",
    "created_at",
    "updated_at",
  ];

  if (columns.some((column) => !expectedColumns.includes(column))) {
    await db.exec("DROP TABLE IF EXISTS satchel_items_lightweight");
    await createSatchelItemsTable(db, "satchel_items_lightweight");
    await db.exec(`
      INSERT OR IGNORE INTO satchel_items_lightweight (
        caido_request_id,
        method,
        url,
        host,
        path,
        created_at,
        updated_at
      )
      SELECT
        caido_request_id,
        NULLIF(method, ''),
        NULLIF(url, ''),
        NULLIF(host, ''),
        NULLIF(path, ''),
        created_at,
        updated_at
      FROM satchel_items
      WHERE caido_request_id IS NOT NULL
        AND caido_request_id != ''
    `);
    await db.exec("DROP TABLE satchel_items");
    await db.exec("ALTER TABLE satchel_items_lightweight RENAME TO satchel_items");
  }

  await createSatchelItemsTable(db, "satchel_items");

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_satchel_items_caido_request_id
    ON satchel_items(caido_request_id)
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_satchel_items_created_at
    ON satchel_items(created_at)
  `);
}

export async function insertSatchelBookmark(
  db: Database,
  bookmark: NewSatchelBookmark,
): Promise<boolean> {
  const stmt = await db.prepare(`
    INSERT OR IGNORE INTO satchel_items (
      caido_request_id,
      method,
      url,
      host,
      path,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = await stmt.run(
    bookmark.caidoRequestId,
    nullableParameter(bookmark.method),
    nullableParameter(bookmark.url),
    nullableParameter(bookmark.host),
    nullableParameter(bookmark.path),
    bookmark.createdAt,
    bookmark.updatedAt,
  );

  return result.changes > 0;
}

export async function listSatchelBookmarkRows(
  db: Database,
  limit: number,
  offset: number,
): Promise<SatchelBookmarkRow[]> {
  const stmt = await db.prepare(`
    SELECT
      id,
      caido_request_id AS caidoRequestId,
      method,
      url,
      host,
      path,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM satchel_items
    ORDER BY created_at DESC
    LIMIT ?
    OFFSET ?
  `);

  const rows = await stmt.all<Record<string, unknown>>(limit, offset);
  return rows.map(mapBookmarkRow);
}

export async function getSatchelBookmarkRow(
  db: Database,
  itemId: number,
): Promise<SatchelBookmarkRow | undefined> {
  const stmt = await db.prepare(`
    SELECT
      id,
      caido_request_id AS caidoRequestId,
      method,
      url,
      host,
      path,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM satchel_items
    WHERE id = ?
  `);

  const row = await stmt.get<Record<string, unknown>>(itemId);
  return row ? mapBookmarkRow(row) : undefined;
}

export async function deleteSatchelBookmarkRow(db: Database, itemId: number) {
  const stmt = await db.prepare(`
    DELETE FROM satchel_items
    WHERE id = ?
  `);

  const result = await stmt.run(itemId);
  return result.changes;
}

export async function clearSatchelBookmarkRows(db: Database) {
  const stmt = await db.prepare("DELETE FROM satchel_items");
  const result = await stmt.run();
  return result.changes;
}
