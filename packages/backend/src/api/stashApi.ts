import type { SDK } from "caido:plugin";

import {
  clearStash,
  getStashedRequest,
  listStashedRequests,
  stashHttpHistoryRequests,
  stashRequests,
  unstashRequest,
} from "../stash/stashService";
import type { API, Events, StashRequestInput } from "../stash/stashTypes";

export function registerStashApi(sdk: SDK<API, Events>) {
  sdk.api.register("stashRequests", (_sdk, inputs: StashRequestInput[]) => {
    return stashRequests(sdk, inputs);
  });

  sdk.api.register("stashHttpHistoryRequests", (_sdk, httpHistoryIds: string[]) => {
    return stashHttpHistoryRequests(sdk, httpHistoryIds);
  });

  sdk.api.register("listStashedRequests", (_sdk, limit = 100, offset = 0) => {
    return listStashedRequests(sdk, limit, offset);
  });

  sdk.api.register("getStashedRequest", (_sdk, stashedRequestId: number) => {
    return getStashedRequest(sdk, stashedRequestId);
  });

  sdk.api.register("unstashRequest", (_sdk, stashedRequestId: number) => {
    return unstashRequest(sdk, stashedRequestId);
  });

  sdk.api.register("clearStash", () => {
    return clearStash(sdk);
  });
}
