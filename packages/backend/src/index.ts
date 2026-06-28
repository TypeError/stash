import type { SDK } from "caido:plugin";

import { registerSatchelApi } from "./api/satchelApi";
import { initDatabase } from "./db/database";
import type { API, Events } from "./satchel/satchelTypes";

export async function init(sdk: SDK<API, Events>) {
  await initDatabase(sdk);
  registerSatchelApi(sdk);
}

export type { API, Events };
