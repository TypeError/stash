import type { SDK } from "caido:plugin";

import {
  addRequestsToStash,
  clearStashItems,
  deleteStashItem,
  getStashItem,
  listStashItems,
} from "../stash/stashService";
import type { API, Events } from "../stash/stashTypes";

export function registerStashApi(sdk: SDK<API, Events>) {
  sdk.api.register("addRequests", (_sdk, requestIds: string[]) => {
    return addRequestsToStash(sdk, requestIds);
  });

  sdk.api.register("listItems", (_sdk, limit = 100, offset = 0) => {
    return listStashItems(sdk, limit, offset);
  });

  sdk.api.register("getItem", (_sdk, itemId: number) => {
    return getStashItem(sdk, itemId);
  });

  sdk.api.register("deleteItem", (_sdk, itemId: number) => {
    return deleteStashItem(sdk, itemId);
  });

  sdk.api.register("clearItems", () => {
    return clearStashItems(sdk);
  });
}
