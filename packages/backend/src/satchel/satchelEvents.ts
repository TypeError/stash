import type { SDK } from "caido:plugin";

import type { Events, SatchelUpdateReason } from "./satchelTypes";

export function emitSatchelUpdated(sdk: SDK<unknown, Events>, reason: SatchelUpdateReason) {
  sdk.api.send("satchel-updated", { reason });
}
