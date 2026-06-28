import type { SDK } from "caido:plugin";

import { createStashRequestFromCaidoRequest } from "./stashedRequest";
import { loadRequestDetails } from "./requestDetails";
import { emitStashUpdated } from "./stashEvents";
import {
  clearStashedRequestRows,
  deleteStashedRequestRow,
  getStashRequestRow,
  insertStashedRequest,
  listStashRequestRows,
} from "./stashRepository";
import type { Events, Result, StashDetail, StashItem, StashedRequestRow } from "./stashTypes";

function errorResult<T>(error: string): Result<T> {
  return { kind: "Error", error };
}

function okResult<T>(value: T): Result<T> {
  return { kind: "Ok", value };
}

function messageFromError(err: unknown, fallback: string) {
  return err instanceof Error && err.message.length > 0 ? err.message : fallback;
}

function buildUnavailableDetail(row: StashedRequestRow): StashDetail {
  return {
    ...buildItem(row),
    available: false,
    request: undefined,
    response: undefined,
  };
}

function buildItem(row: StashedRequestRow): StashItem {
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

      const stashedRequest = createStashRequestFromCaidoRequest(pair.request, requestId);
      const inserted = await insertStashedRequest(db, stashedRequest);

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
    return errorResult(messageFromError(err, "Could not stash request."));
  }
}

export async function listStashItems(
  sdk: SDK,
  limit = 100,
  offset = 0,
): Promise<Result<StashItem[]>> {
  try {
    const db = await sdk.meta.db();
    const rows = await listStashRequestRows(db, limit, offset);
    return okResult(rows.map(buildItem));
  } catch (err) {
    return errorResult(messageFromError(err, "Could not load stashed requests."));
  }
}

export async function getStashItem(
  sdk: SDK,
  itemId: number,
): Promise<Result<StashDetail | undefined>> {
  try {
    const db = await sdk.meta.db();
    const row = await getStashRequestRow(db, itemId);

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

export async function unstashItem(
  sdk: SDK<unknown, Events>,
  itemId: number,
): Promise<Result<{ deleted: boolean }>> {
  try {
    const db = await sdk.meta.db();
    const deletedRows = await deleteStashedRequestRow(db, itemId);

    if (deletedRows === 0) {
      return okResult({ deleted: false });
    }

    emitStashUpdated(sdk, "delete");

    return okResult({ deleted: true });
  } catch (err) {
    return errorResult(messageFromError(err, "Could not remove stashed request."));
  }
}

export async function clearStashedItems(
  sdk: SDK<unknown, Events>,
): Promise<Result<{ deletedItems: number }>> {
  try {
    const db = await sdk.meta.db();
    const deletedItems = await clearStashedRequestRows(db);

    if (deletedItems > 0) {
      emitStashUpdated(sdk, "clear");
    }

    return okResult({ deletedItems });
  } catch (err) {
    return errorResult(messageFromError(err, "Could not clear stashed requests."));
  }
}
