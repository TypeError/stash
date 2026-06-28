import type { DefineAPI, DefineEvents } from "caido:plugin";

import type {
  addRequestsToSatchel,
  clearSatchelItems,
  deleteSatchelItem,
  getSatchelItem,
  listSatchelItems,
} from "./satchelService";

export type SatchelUpdateReason = "add" | "delete" | "clear";

export type Result<T> = { kind: "Error"; error: string } | { kind: "Ok"; value: T };

export type SatchelItem = {
  id: number;
  caidoRequestId: string;
  method: string | undefined;
  url: string | undefined;
  host: string | undefined;
  path: string | undefined;
  createdAt: string;
  updatedAt: string;
};

export type SatchelDetail = SatchelItem & {
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

export type NewSatchelBookmark = {
  caidoRequestId: string;
  method: string | undefined;
  url: string | undefined;
  host: string | undefined;
  path: string | undefined;
  createdAt: string;
  updatedAt: string;
};

export type SatchelBookmarkRow = NewSatchelBookmark & {
  id: number;
};

export type SatchelRequestDetails = {
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
  "satchel-updated": (event: { reason: SatchelUpdateReason }) => void;
}>;

export type API = DefineAPI<{
  addRequests: typeof addRequestsToSatchel;
  listItems: typeof listSatchelItems;
  getItem: typeof getSatchelItem;
  deleteItem: typeof deleteSatchelItem;
  clearItems: typeof clearSatchelItems;
}>;
