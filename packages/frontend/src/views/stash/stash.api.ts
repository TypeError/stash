import type { Caido } from "@caido/sdk-frontend";
import type { API, Events } from "backend";

type CaidoSDK = Caido<API, Events>;

export function listStashItems(sdk: CaidoSDK, limit = 100, offset = 0) {
  return sdk.backend.listItems(limit, offset);
}

export function getStashItem(sdk: CaidoSDK, itemId: number) {
  return sdk.backend.getItem(itemId);
}

export function deleteStashItem(sdk: CaidoSDK, itemId: number) {
  return sdk.backend.deleteItem(itemId);
}

export function clearStashItems(sdk: CaidoSDK) {
  return sdk.backend.clearItems();
}
