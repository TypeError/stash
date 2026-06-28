import type { SDK } from "caido:plugin";

import { registerStashApi } from "./api/stashApi";
import { initDatabase } from "./db/database";
import type { API, Events } from "./stash/stashTypes";

export async function init(sdk: SDK<API, Events>) {
  await initDatabase(sdk);
  registerStashApi(sdk);
}

export type { API, Events };
