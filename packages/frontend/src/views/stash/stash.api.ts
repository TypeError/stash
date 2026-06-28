import type { Caido } from "@caido/sdk-frontend";
import type { API, Events } from "backend";

type CaidoSDK = Caido<API, Events>;

export function listStashedRequests(sdk: CaidoSDK, limit = 100, offset = 0) {
  return sdk.backend.listStashedRequests(limit, offset);
}

export function getStashedRequest(sdk: CaidoSDK, stashedRequestId: number) {
  return sdk.backend.getStashedRequest(stashedRequestId);
}

export function unstashRequest(sdk: CaidoSDK, stashedRequestId: number) {
  return sdk.backend.unstashRequest(stashedRequestId);
}

export function clearStash(sdk: CaidoSDK) {
  return sdk.backend.clearStash();
}
