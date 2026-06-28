import { Classic } from "@caido/primevue";
import PrimeVue from "primevue/config";
import Tooltip from "primevue/tooltip";
import { createApp } from "vue";

import { SDKPlugin } from "./plugins/sdk";
import "./styles/index.css";
import type { FrontendSDK } from "./types";
import App from "./views/App.vue";
import { registerStashCommands } from "./views/stash/stash.commands";

export const init = (sdk: FrontendSDK) => {
  registerStashCommands(sdk);

  const app = createApp(App);

  app.use(PrimeVue, {
    unstyled: true,
    pt: Classic,
  });

  app.use(SDKPlugin, sdk);

  app.directive("tooltip", Tooltip);

  const root = document.createElement("div");
  Object.assign(root.style, {
    height: "100%",
    width: "100%",
  });
  root.id = "plugin--stash";

  app.mount(root);

  sdk.navigation.addPage("/stash", {
    body: root,
  });

  sdk.sidebar.registerItem("Stash", "/stash", {
    icon: "fas fa-box",
  });
};
