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
  StashRequestInput,
  StashedRequest,
  StashedRequestRow,
  StashedRequestDetail,
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
    requestId: row.requestId,
    httpHistoryId: row.httpHistoryId,
    method: row.method,
    url: row.url,
    host: row.host,
    path: row.path,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getStashInputFromHttpHistoryId(
  sdk: SDK,
  httpHistoryId: string,
): Promise<StashRequestInput | undefined> {
  const page = await sdk.requests.query().filter(`row.id.eq:${httpHistoryId}`).first(1).execute();
  const item = page.items[0];

  if (item === undefined) {
    return undefined;
  }

  return {
    requestId: String(item.request.getId()),
    httpHistoryId,
  };
}

export async function stashRequests(
  sdk: SDK<unknown, Events>,
  inputs: StashRequestInput[],
): Promise<Result<{ stashed: number; skipped: number }>> {
  try {
    const db = await sdk.meta.db();

    let stashed = 0;
    let skipped = 0;
    let updated = 0;

    for (const input of inputs) {
      if (input.requestId === "") {
        skipped += 1;
        continue;
      }

      const pair = await sdk.requests.get(input.requestId);

      if (pair === undefined) {
        skipped += 1;
        continue;
      }

      const stashedRequest = createStashRequestFromCaidoRequest(pair.request, input);
      const stashResult = await insertStashedRequest(db, stashedRequest);

      if (stashResult === "inserted") {
        stashed += 1;
      } else if (stashResult === "updated") {
        updated += 1;
        skipped += 1;
      } else {
        skipped += 1;
      }
    }

    if (stashed > 0 || updated > 0) {
      emitStashUpdated(sdk, "stash");
    }

    return okResult({ stashed, skipped });
  } catch (err) {
    return errorResult(messageFromError(err, "Could not stash request."));
  }
}

export async function stashHttpHistoryRequests(
  sdk: SDK<unknown, Events>,
  httpHistoryIds: string[],
): Promise<Result<{ stashed: number; skipped: number }>> {
  try {
    const inputs: StashRequestInput[] = [];
    let skipped = 0;

    for (const httpHistoryId of httpHistoryIds) {
      const input = await getStashInputFromHttpHistoryId(sdk, httpHistoryId);

      if (input === undefined) {
        skipped += 1;
      } else {
        inputs.push(input);
      }
    }

    const result = await stashRequests(sdk, inputs);

    if (result.kind === "Error") {
      return result;
    }

    return okResult({
      stashed: result.value.stashed,
      skipped: result.value.skipped + skipped,
    });
  } catch (err) {
    return errorResult(messageFromError(err, "Could not stash selected requests."));
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
  stashedRequestId: number,
): Promise<Result<StashedRequestDetail | undefined>> {
  try {
    const db = await sdk.meta.db();
    const row = await getStashRequestRow(db, stashedRequestId);

    if (row === undefined) {
      return okResult(undefined);
    }

    const details = await loadRequestDetails(sdk, row.requestId);

    if (details === undefined) {
      return okResult(buildUnavailableDetail(row));
    }

    return okResult({
      id: row.id,
      requestId: row.requestId,
      httpHistoryId: row.httpHistoryId,
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
  stashedRequestId: number,
): Promise<Result<{ unstashed: boolean }>> {
  try {
    const db = await sdk.meta.db();
    const deletedRows = await deleteStashedRequestRow(db, stashedRequestId);

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
