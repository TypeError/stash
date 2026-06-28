import type { DefineAPI, DefineEvents } from "caido:plugin";

import type {
  addRequestsToSatchel,
  clearSatchelItems,
  deleteSatchelItem,
  getSatchelItem,
  listSatchelItems,
} from "./satchelService";

export type SatchelUpdateReason = "add" | "delete" | "clear";

export type SatchelItem = {
  id: number;
  caidoRequestId: string;
  method: string | null;
  url: string | null;
  host: string | null;
  path: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SatchelDetail = SatchelItem & {
  available: boolean;
  request: {
    headers: Record<string, string[]>;
    bodyText: string | null;
    rawRequest: string | null;
  } | null;
  response: {
    statusCode: number | null;
    headers: Record<string, string[]>;
    bodyText: string | null;
  } | null;
};

export type NewSatchelBookmark = {
  caidoRequestId: string;
  method: string | null;
  url: string | null;
  host: string | null;
  path: string | null;
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
    bodyText: string | null;
    rawRequest: string | null;
  };
  response: {
    statusCode: number | null;
    headers: Record<string, string[]>;
    bodyText: string | null;
  } | null;
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
