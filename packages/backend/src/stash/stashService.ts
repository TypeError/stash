import type { SDK } from "caido:plugin";

import { loadRequestDetails } from "./requestDetails";
import { emitStashUpdated } from "./stashEvents";
import { createStashRequestFromCaidoRequest } from "./stashedRequest";
import {
  clearStashedRequestRows,
  deleteStashedRequestRow,
  getStashRequestRow,
  insertStashedRequest,
  listStashRequestRows,
} from "./stashRepository";
import type {
  Events,
  Result,
  StashedRequest,
  StashedRequestDetail,
  StashedRequestRow,
} from "./stashTypes";

function errorResult<T>(error: string): Result<T> {
  return { kind: "Error", error };
}

function okResult<T>(value: T): Result<T> {
  return { kind: "Ok", value };
}

function messageFromError(err: unknown, fallback: string) {
  return err instanceof Error && err.message.length > 0 ? err.message : fallback;
}

function buildUnavailableDetail(row: StashedRequestRow): StashedRequestDetail {
  return {
    ...buildStashedRequest(row),
    available: false,
    request: undefined,
    response: undefined,
  };
}

function buildStashedRequest(row: StashedRequestRow): StashedRequest {
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

export async function stashRequests(
  sdk: SDK<unknown, Events>,
  requestIds: string[],
): Promise<Result<{ stashed: number; skipped: number }>> {
  try {
    const db = await sdk.meta.db();

    let stashed = 0;
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
        stashed += 1;
      } else {
        skipped += 1;
      }
    }

    if (stashed > 0) {
      emitStashUpdated(sdk, "stash");
    }

    return okResult({ stashed, skipped });
  } catch (err) {
    return errorResult(messageFromError(err, "Could not stash request."));
  }
}

export async function listStashedRequests(
  sdk: SDK,
  limit = 100,
  offset = 0,
): Promise<Result<StashedRequest[]>> {
  try {
    const db = await sdk.meta.db();
    const rows = await listStashRequestRows(db, limit, offset);
    return okResult(rows.map(buildStashedRequest));
  } catch (err) {
    return errorResult(messageFromError(err, "Could not load stashed requests."));
  }
}

export async function getStashedRequest(
  sdk: SDK,
  requestId: number,
): Promise<Result<StashedRequestDetail | undefined>> {
  try {
    const db = await sdk.meta.db();
    const row = await getStashRequestRow(db, requestId);

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
    } satisfies StashedRequestDetail);
  } catch (err) {
    return errorResult(messageFromError(err, "Could not load HTTP history item."));
  }
}

export async function unstashRequest(
  sdk: SDK<unknown, Events>,
  requestId: number,
): Promise<Result<{ unstashed: boolean }>> {
  try {
    const db = await sdk.meta.db();
    const deletedRows = await deleteStashedRequestRow(db, requestId);

    if (deletedRows === 0) {
      return okResult({ unstashed: false });
    }

    emitStashUpdated(sdk, "unstash");

    return okResult({ unstashed: true });
  } catch (err) {
    return errorResult(messageFromError(err, "Could not unstash request."));
  }
}

export async function clearStash(
  sdk: SDK<unknown, Events>,
): Promise<Result<{ unstashed: number }>> {
  try {
    const unstashed = await clearStashedRequestRows(await sdk.meta.db());

    if (unstashed > 0) {
      emitStashUpdated(sdk, "clear");
    }

    return okResult({ unstashed });
  } catch (err) {
    return errorResult(messageFromError(err, "Could not clear stash."));
  }
}
