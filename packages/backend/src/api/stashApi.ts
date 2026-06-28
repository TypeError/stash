import type { SDK } from "caido:plugin";

import {
  clearStash,
  getStashedRequest,
  listStashedRequests,
  stashRequests,
  unstashRequest,
} from "../stash/stashService";
import type { API, Events } from "../stash/stashTypes";

export function registerStashApi(sdk: SDK<API, Events>) {
  sdk.api.register("stashRequests", (_sdk, requestIds: string[]) => {
    return stashRequests(sdk, requestIds);
  });

  sdk.api.register("listStashedRequests", (_sdk, limit = 100, offset = 0) => {
    return listStashedRequests(sdk, limit, offset);
  });

  sdk.api.register("getStashedRequest", (_sdk, requestId: number) => {
    return getStashedRequest(sdk, requestId);
  });

  sdk.api.register("unstashRequest", (_sdk, requestId: number) => {
    return unstashRequest(sdk, requestId);
  });

  sdk.api.register("clearStash", () => {
    return clearStash(sdk);
  });
}
