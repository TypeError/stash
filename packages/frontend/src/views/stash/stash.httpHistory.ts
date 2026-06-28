import type { FrontendSDK } from "@/types";

import type { StashItem } from "./stash.types";

type HttpHistoryQuery = Parameters<FrontendSDK["httpHistory"]["setQuery"]>[0];

const httpHistoryPath = "/http-history";

export function isUsableRequestId(requestId: string | undefined): requestId is string {
  return requestId !== undefined && requestId.length > 0;
}

export function isHttpHistoryRowId(requestId: string | undefined): requestId is string {
  return requestId !== undefined && /^\d+$/.test(requestId);
}

export function getUniqueHttpHistoryRowIds(items: StashItem[]) {
  const rowIds = items.map((item) => item.caidoRequestId).filter(isHttpHistoryRowId);

  return Array.from(new Set(rowIds));
}

export function createHttpHistoryRowsQuery(rowIds: string[]): HttpHistoryQuery {
  return `(${rowIds.map((rowId) => `row.id.eq:${rowId}`).join(" OR ")})` as HttpHistoryQuery;
}

export function showHttpHistoryRows(sdk: FrontendSDK | undefined, rowIds: string[]) {
  const httpHistoryRowIds = rowIds.filter(isHttpHistoryRowId);

  if (sdk === undefined || httpHistoryRowIds.length === 0) {
    return;
  }

  const query = createHttpHistoryRowsQuery(httpHistoryRowIds);

  if (sdk.httpHistory.getQuery() !== query) {
    sdk.httpHistory.setQuery(query);
  }

  sdk.navigation.goTo(httpHistoryPath);
}

export function showHttpHistoryRow(sdk: FrontendSDK | undefined, requestId: string | undefined) {
  if (sdk === undefined || !isHttpHistoryRowId(requestId)) {
    return;
  }

  showHttpHistoryRows(sdk, [requestId]);
}
