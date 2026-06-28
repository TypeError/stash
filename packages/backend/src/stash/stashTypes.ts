import type { DefineAPI, DefineEvents } from "caido:plugin";

import type {
  addRequestsToStash,
  clearStashItems,
  deleteStashItem,
  getStashItem,
  listStashItems,
} from "./stashService";

export type StashUpdateReason = "add" | "delete" | "clear";

export type Result<T> = { kind: "Error"; error: string } | { kind: "Ok"; value: T };

export type StashItem = {
  id: number;
  caidoRequestId: string;
  method: string | undefined;
  url: string | undefined;
  host: string | undefined;
  path: string | undefined;
  createdAt: string;
  updatedAt: string;
};

export type StashDetail = StashItem & {
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

export type NewStashSave = {
  caidoRequestId: string;
  method: string | undefined;
  url: string | undefined;
  host: string | undefined;
  path: string | undefined;
  createdAt: string;
  updatedAt: string;
};

export type StashSaveRow = NewStashSave & {
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
  addRequests: typeof addRequestsToStash;
  listItems: typeof listStashItems;
  getItem: typeof getStashItem;
  deleteItem: typeof deleteStashItem;
  clearItems: typeof clearStashItems;
}>;
