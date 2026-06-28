import type { SDK } from "caido:plugin";

import {
  addRequestsToSatchel,
  clearSatchelItems,
  deleteSatchelItem,
  getSatchelItem,
  listSatchelItems,
} from "../satchel/satchelService";
import type { API, Events } from "../satchel/satchelTypes";

export function registerSatchelApi(sdk: SDK<API, Events>) {
  sdk.api.register("addRequests", (_sdk, requestIds: string[]) => {
    return addRequestsToSatchel(sdk, requestIds);
  });

  sdk.api.register("listItems", (_sdk, limit = 100, offset = 0) => {
    return listSatchelItems(sdk, limit, offset);
  });

  sdk.api.register("getItem", (_sdk, itemId: number) => {
    return getSatchelItem(sdk, itemId);
  });

  sdk.api.register("deleteItem", (_sdk, itemId: number) => {
    return deleteSatchelItem(sdk, itemId);
  });

  sdk.api.register("clearItems", () => {
    return clearSatchelItems(sdk);
  });
}
