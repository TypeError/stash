import type { FrontendSDK } from "@/types";

import type { StashItem } from "./stash.types";

type HttpHistoryQuery = Parameters<FrontendSDK["httpHistory"]["setQuery"]>[0];

const httpHistoryPath = "/http-history";

export function isHttpHistoryId(httpHistoryId: string | undefined): httpHistoryId is string {
  return httpHistoryId !== undefined && /^\d+$/.test(httpHistoryId);
}

export function getUniqueHttpHistoryIds(items: StashItem[]) {
  const httpHistoryIds = items.map((item) => item.httpHistoryId).filter(isHttpHistoryId);

  return Array.from(new Set(httpHistoryIds));
}

function createHttpHistoryRowsQuery(httpHistoryIds: string[]): HttpHistoryQuery {
  return `(${httpHistoryIds
    .map((httpHistoryId) => `row.id.eq:${httpHistoryId}`)
    .join(" OR ")})` as HttpHistoryQuery;
}

export function showHttpHistoryRows(sdk: FrontendSDK | undefined, httpHistoryIds: string[]) {
  const validHttpHistoryIds = httpHistoryIds.filter(isHttpHistoryId);

  if (sdk === undefined || validHttpHistoryIds.length === 0) {
    return;
  }

  const query = createHttpHistoryRowsQuery(validHttpHistoryIds);

  if (sdk.httpHistory.getQuery() !== query) {
    sdk.httpHistory.setQuery(query);
  }

  sdk.navigation.goTo(httpHistoryPath);
}

export function showHttpHistoryRow(
  sdk: FrontendSDK | undefined,
  httpHistoryId: string | undefined,
) {
  if (sdk === undefined || !isHttpHistoryId(httpHistoryId)) {
    return;
  }

  showHttpHistoryRows(sdk, [httpHistoryId]);
}
