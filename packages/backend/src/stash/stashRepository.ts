import type { Database, Parameter } from "sqlite";

import type { NewStashedRequest, StashedRequestRow } from "./stashTypes";

type InsertStashedRequestResult = "inserted" | "updated" | "skipped";

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readRequiredString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readRequiredNumber(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function nullableParameter(value: string | undefined): Parameter {
  return value === undefined ? null : value;
}

function mapStashedRequestRow(row: Record<string, unknown>): StashedRequestRow {
  return {
    id: readRequiredNumber(row.id),
    requestId: readRequiredString(row.requestId),
    httpHistoryId: readString(row.httpHistoryId),
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

async function createStashItemsTable(db: Database, tableName: string) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL UNIQUE,
      http_history_id TEXT,
      method TEXT,
      url TEXT,
      host TEXT,
      path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

export async function migrateStashStorage(db: Database) {
  const columns = await getTableColumns(db, "stash_items");
  const expectedColumns = [
    "id",
    "request_id",
    "http_history_id",
    "method",
    "url",
    "host",
    "path",
    "created_at",
    "updated_at",
  ];

  if (
    columns.length > 0 &&
    (!expectedColumns.every((column) => columns.includes(column)) ||
      columns.some((column) => !expectedColumns.includes(column)))
  ) {
    const requestIdColumn = columns.includes("request_id")
      ? "request_id"
      : columns.includes("caido_request_id")
        ? "caido_request_id"
        : undefined;
    const httpHistoryIdExpression = columns.includes("http_history_id")
      ? "NULLIF(http_history_id, '')"
      : "NULL";

    await db.exec("DROP TABLE IF EXISTS stash_items_lightweight");
    await createStashItemsTable(db, "stash_items_lightweight");

    if (requestIdColumn !== undefined) {
      await db.exec(`
        INSERT OR IGNORE INTO stash_items_lightweight (
          request_id,
          http_history_id,
          method,
          url,
          host,
          path,
          created_at,
          updated_at
        )
        SELECT
          NULLIF(${requestIdColumn}, ''),
          ${httpHistoryIdExpression},
          NULLIF(method, ''),
          NULLIF(url, ''),
          NULLIF(host, ''),
          NULLIF(path, ''),
          created_at,
          updated_at
        FROM stash_items
        WHERE ${requestIdColumn} IS NOT NULL
          AND ${requestIdColumn} != ''
      `);
    }

    await db.exec("DROP TABLE stash_items");
    await db.exec("ALTER TABLE stash_items_lightweight RENAME TO stash_items");
  }

  await createStashItemsTable(db, "stash_items");

  await db.exec(`
    UPDATE stash_items
    SET http_history_id = NULL
    WHERE http_history_id = request_id
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stash_items_request_id
    ON stash_items(request_id)
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stash_items_http_history_id
    ON stash_items(http_history_id)
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stash_items_created_at
    ON stash_items(created_at)
  `);
}

export async function insertStashedRequest(
  db: Database,
  stashedRequest: NewStashedRequest,
): Promise<InsertStashedRequestResult> {
  const stmt = await db.prepare(`
    INSERT OR IGNORE INTO stash_items (
      request_id,
      http_history_id,
      method,
      url,
      host,
      path,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = await stmt.run(
    stashedRequest.requestId,
    nullableParameter(stashedRequest.httpHistoryId),
    nullableParameter(stashedRequest.method),
    nullableParameter(stashedRequest.url),
    nullableParameter(stashedRequest.host),
    nullableParameter(stashedRequest.path),
    stashedRequest.createdAt,
    stashedRequest.updatedAt,
  );

  if (result.changes > 0) {
    return "inserted";
  }

  if (stashedRequest.httpHistoryId === undefined) {
    return "skipped";
  }

  const updateStmt = await db.prepare(`
    UPDATE stash_items
    SET
      http_history_id = ?,
      method = ?,
      url = ?,
      host = ?,
      path = ?,
      updated_at = ?
    WHERE request_id = ?
      AND (
        http_history_id IS NULL
        OR http_history_id = ''
        OR http_history_id = request_id
        OR http_history_id != ?
      )
  `);

  const updateResult = await updateStmt.run(
    stashedRequest.httpHistoryId,
    nullableParameter(stashedRequest.method),
    nullableParameter(stashedRequest.url),
    nullableParameter(stashedRequest.host),
    nullableParameter(stashedRequest.path),
    stashedRequest.updatedAt,
    stashedRequest.requestId,
    stashedRequest.httpHistoryId,
  );

  return updateResult.changes > 0 ? "updated" : "skipped";
}

export async function listStashRequestRows(
  db: Database,
  limit: number,
  offset: number,
): Promise<StashedRequestRow[]> {
  const stmt = await db.prepare(`
    SELECT
      id,
      request_id AS requestId,
      http_history_id AS httpHistoryId,
      method,
      url,
      host,
      path,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM stash_items
    ORDER BY created_at DESC
    LIMIT ?
    OFFSET ?
  `);

  const rows = await stmt.all<Record<string, unknown>>(limit, offset);
  return rows.map(mapStashedRequestRow);
}

export async function getStashRequestRow(
  db: Database,
  itemId: number,
): Promise<StashedRequestRow | undefined> {
  const stmt = await db.prepare(`
    SELECT
      id,
      request_id AS requestId,
      http_history_id AS httpHistoryId,
      method,
      url,
      host,
      path,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM stash_items
    WHERE id = ?
  `);

  const row = await stmt.get<Record<string, unknown>>(itemId);
  return row ? mapStashedRequestRow(row) : undefined;
}

export async function deleteStashedRequestRow(db: Database, itemId: number) {
  const stmt = await db.prepare(`
    DELETE FROM stash_items
    WHERE id = ?
  `);

  const result = await stmt.run(itemId);
  return result.changes;
}

export async function clearStashedRequestRows(db: Database) {
  const stmt = await db.prepare("DELETE FROM stash_items");
  const result = await stmt.run();
  return result.changes;
}
