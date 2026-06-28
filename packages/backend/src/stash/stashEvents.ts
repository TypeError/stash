import type { SDK } from "caido:plugin";

import type { Events, StashUpdateReason } from "./stashTypes";

export function emitStashUpdated(sdk: SDK<unknown, Events>, reason: StashUpdateReason) {
  sdk.api.send("stash-updated", { reason });
}
