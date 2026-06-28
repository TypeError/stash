import type { DefineAPI, DefineEvents } from "caido:plugin";

import type {
  clearStash,
  getStashedRequest,
  listStashedRequests,
  stashHttpHistoryRequests,
  stashRequests,
  unstashRequest,
} from "./stashService";

export type StashUpdateReason = "stash" | "unstash" | "clear";

export type Result<T> = { kind: "Error"; error: string } | { kind: "Ok"; value: T };

export type StashRequestInput = {
  requestId: string;
  httpHistoryId: string | undefined;
};

export type StashedRequest = {
  id: number;
  requestId: string;
  httpHistoryId: string | undefined;
  method: string | undefined;
  url: string | undefined;
  host: string | undefined;
  path: string | undefined;
  createdAt: string;
  updatedAt: string;
};

export type StashedRequestDetail = StashedRequest & {
  available: boolean;
  request:
    | {
        headers: Record<string, string[]>;
        bodyText: string | undefined;
        rawRequest: string | undefined;
      }
    | undefined;
  response:
    | {
        statusCode: number | undefined;
        headers: Record<string, string[]>;
        bodyText: string | undefined;
      }
    | undefined;
};

export type NewStashedRequest = {
  requestId: string;
  httpHistoryId: string | undefined;
  method: string | undefined;
  url: string | undefined;
  host: string | undefined;
  path: string | undefined;
  createdAt: string;
  updatedAt: string;
};

export type StashedRequestRow = NewStashedRequest & {
  id: number;
};

export type StashRequestDetails = {
  method: string;
  url: string;
  host: string;
  path: string;
  request: {
    headers: Record<string, string[]>;
    bodyText: string | undefined;
    rawRequest: string | undefined;
  };
  response:
    | {
        statusCode: number | undefined;
        headers: Record<string, string[]>;
        bodyText: string | undefined;
      }
    | undefined;
};

export type Events = DefineEvents<{
  "stash-updated": (event: { reason: StashUpdateReason }) => void;
}>;

export type API = DefineAPI<{
  stashRequests: typeof stashRequests;
  stashHttpHistoryRequests: typeof stashHttpHistoryRequests;
  listStashedRequests: typeof listStashedRequests;
  getStashedRequest: typeof getStashedRequest;
  unstashRequest: typeof unstashRequest;
  clearStash: typeof clearStash;
}>;
