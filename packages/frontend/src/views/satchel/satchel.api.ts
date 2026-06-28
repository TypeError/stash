import type { Caido } from "@caido/sdk-frontend";
import type { API, Events } from "backend";

type CaidoSDK = Caido<API, Events>;

export function listSatchelItems(sdk: CaidoSDK, limit = 100, offset = 0) {
  return sdk.backend.listItems(limit, offset);
}

export function getSatchelItem(sdk: CaidoSDK, itemId: number) {
  return sdk.backend.getItem(itemId);
}

export function deleteSatchelItem(sdk: CaidoSDK, itemId: number) {
  return sdk.backend.deleteItem(itemId);
}

export function clearSatchelItems(sdk: CaidoSDK) {
  return sdk.backend.clearItems();
}
