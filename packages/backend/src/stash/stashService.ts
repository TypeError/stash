import type { SDK } from "caido:plugin";

import { createStashSaveFromCaidoRequest } from "./requestSave";
import { loadRequestDetails } from "./requestDetails";
import { emitStashUpdated } from "./stashEvents";
import {
  clearStashSaveRows,
  deleteStashSaveRow,
  getStashSaveRow,
  insertStashSave,
  listStashSaveRows,
} from "./stashRepository";
import type { Events, Result, StashDetail, StashItem, StashSaveRow } from "./stashTypes";

function errorResult<T>(error: string): Result<T> {
  return { kind: "Error", error };
}

function okResult<T>(value: T): Result<T> {
  return { kind: "Ok", value };
}

function messageFromError(err: unknown, fallback: string) {
  return err instanceof Error && err.message.length > 0 ? err.message : fallback;
}

function buildUnavailableDetail(row: StashSaveRow): StashDetail {
  return {
    ...buildItem(row),
    available: false,
    request: undefined,
    response: undefined,
  };
}

function buildItem(row: StashSaveRow): StashItem {
  return {
    id: row.id,
    caidoRequestId: row.caidoRequestId,
    method: row.method,
    url: row.url,
    host: row.host,
    path: row.path,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function addRequestsToStash(
  sdk: SDK<unknown, Events>,
  requestIds: string[],
): Promise<Result<{ added: number; skipped: number }>> {
  try {
    const db = await sdk.meta.db();

    let added = 0;
    let skipped = 0;

    for (const requestId of requestIds) {
      const pair = await sdk.requests.get(requestId);

      if (pair === undefined) {
        skipped += 1;
        continue;
      }

      const save = createStashSaveFromCaidoRequest(pair.request, requestId);
      const inserted = await insertStashSave(db, save);

      if (inserted) {
        added += 1;
      } else {
        skipped += 1;
      }
    }

    if (added > 0) {
      emitStashUpdated(sdk, "add");
    }

    return okResult({ added, skipped });
  } catch (err) {
    return errorResult(messageFromError(err, "Could not save request."));
  }
}

export async function listStashItems(
  sdk: SDK,
  limit = 100,
  offset = 0,
): Promise<Result<StashItem[]>> {
  try {
    const db = await sdk.meta.db();
    const rows = await listStashSaveRows(db, limit, offset);
    return okResult(rows.map(buildItem));
  } catch (err) {
    return errorResult(messageFromError(err, "Could not load saved requests."));
  }
}

export async function getStashItem(
  sdk: SDK,
  itemId: number,
): Promise<Result<StashDetail | undefined>> {
  try {
    const db = await sdk.meta.db();
    const row = await getStashSaveRow(db, itemId);

    if (row === undefined) {
      return okResult(undefined);
    }

    const details = await loadRequestDetails(sdk, row.caidoRequestId);

    if (details === undefined) {
      return okResult(buildUnavailableDetail(row));
    }

    return okResult({
      id: row.id,
      caidoRequestId: row.caidoRequestId,
      method: details.method,
      url: details.url,
      host: details.host,
      path: details.path,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      available: true,
      request: details.request,
      response: details.response,
    } satisfies StashDetail);
  } catch (err) {
    return errorResult(messageFromError(err, "Could not load HTTP history item."));
  }
}

export async function deleteStashItem(
  sdk: SDK<unknown, Events>,
  itemId: number,
): Promise<Result<{ deleted: boolean }>> {
  try {
    const db = await sdk.meta.db();
    const deletedRows = await deleteStashSaveRow(db, itemId);

    if (deletedRows === 0) {
      return okResult({ deleted: false });
    }

    emitStashUpdated(sdk, "delete");

    return okResult({ deleted: true });
  } catch (err) {
    return errorResult(messageFromError(err, "Could not remove saved request."));
  }
}

export async function clearStashItems(
  sdk: SDK<unknown, Events>,
): Promise<Result<{ deletedItems: number }>> {
  try {
    const db = await sdk.meta.db();
    const deletedItems = await clearStashSaveRows(db);

    if (deletedItems > 0) {
      emitStashUpdated(sdk, "clear");
    }

    return okResult({ deletedItems });
  } catch (err) {
    return errorResult(messageFromError(err, "Could not clear saved requests."));
  }
}
