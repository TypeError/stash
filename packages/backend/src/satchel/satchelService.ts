import type { SDK } from "caido:plugin";

import { createBookmarkFromCaidoRequest } from "./requestBookmark";
import { loadRequestDetails } from "./requestDetails";
import { emitSatchelUpdated } from "./satchelEvents";
import {
  clearSatchelBookmarkRows,
  deleteSatchelBookmarkRow,
  getSatchelBookmarkRow,
  insertSatchelBookmark,
  listSatchelBookmarkRows,
} from "./satchelRepository";
import type {
  Events,
  Result,
  SatchelBookmarkRow,
  SatchelDetail,
  SatchelItem,
} from "./satchelTypes";

function errorResult<T>(error: string): Result<T> {
  return { kind: "Error", error };
}

function okResult<T>(value: T): Result<T> {
  return { kind: "Ok", value };
}

function messageFromError(err: unknown, fallback: string) {
  return err instanceof Error && err.message.length > 0 ? err.message : fallback;
}

function buildUnavailableDetail(row: SatchelBookmarkRow): SatchelDetail {
  return {
    ...buildItem(row),
    available: false,
    request: undefined,
    response: undefined,
  };
}

function buildItem(row: SatchelBookmarkRow): SatchelItem {
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

export async function addRequestsToSatchel(
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

      const bookmark = createBookmarkFromCaidoRequest(pair.request, requestId);
      const inserted = await insertSatchelBookmark(db, bookmark);

      if (inserted) {
        added += 1;
      } else {
        skipped += 1;
      }
    }

    if (added > 0) {
      emitSatchelUpdated(sdk, "add");
    }

    return okResult({ added, skipped });
  } catch (err) {
    return errorResult(messageFromError(err, "Could not save bookmark."));
  }
}

export async function listSatchelItems(
  sdk: SDK,
  limit = 100,
  offset = 0,
): Promise<Result<SatchelItem[]>> {
  try {
    const db = await sdk.meta.db();
    const rows = await listSatchelBookmarkRows(db, limit, offset);
    return okResult(rows.map(buildItem));
  } catch (err) {
    return errorResult(messageFromError(err, "Could not load bookmarks."));
  }
}

export async function getSatchelItem(
  sdk: SDK,
  itemId: number,
): Promise<Result<SatchelDetail | undefined>> {
  try {
    const db = await sdk.meta.db();
    const row = await getSatchelBookmarkRow(db, itemId);

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
    } satisfies SatchelDetail);
  } catch (err) {
    return errorResult(messageFromError(err, "Could not load HTTP history item."));
  }
}

export async function deleteSatchelItem(
  sdk: SDK<unknown, Events>,
  itemId: number,
): Promise<Result<{ deleted: boolean }>> {
  try {
    const db = await sdk.meta.db();
    const deletedRows = await deleteSatchelBookmarkRow(db, itemId);

    if (deletedRows === 0) {
      return okResult({ deleted: false });
    }

    emitSatchelUpdated(sdk, "delete");

    return okResult({ deleted: true });
  } catch (err) {
    return errorResult(messageFromError(err, "Could not remove bookmark."));
  }
}

export async function clearSatchelItems(
  sdk: SDK<unknown, Events>,
): Promise<Result<{ deletedItems: number }>> {
  try {
    const db = await sdk.meta.db();
    const deletedItems = await clearSatchelBookmarkRows(db);

    if (deletedItems > 0) {
      emitSatchelUpdated(sdk, "clear");
    }

    return okResult({ deletedItems });
  } catch (err) {
    return errorResult(messageFromError(err, "Could not clear bookmarks."));
  }
}
