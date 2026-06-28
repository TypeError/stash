import { Classic } from "@caido/primevue";
import PrimeVue from "primevue/config";
import { createApp } from "vue";

import { SDKPlugin } from "./plugins/sdk";
import "./styles/index.css";
import type { FrontendSDK } from "./types";
import App from "./views/App.vue";

const Commands = {
  add: "satchel.add",
} as const;

type CommandContext =
  | { type: "BaseContext" }
  | {
      type: "RequestRowContext";
      requests: {
        id: string;
      }[];
    }
  | {
      type: "RequestContext";
      request: {
        raw: string;
      };
      selection: string;
    }
  | {
      type: "ResponseContext";
      request: {
        id: string;
      };
      response: {
        id: string;
      };
      selection: string;
    };

function getRequestIdsFromContext(context: CommandContext): string[] {
  if (context.type === "RequestRowContext") {
    return [
      ...new Set(context.requests.map((request) => request.id).filter((id) => id.length > 0)),
    ];
  }

  if (context.type === "ResponseContext" && context.request.id.length > 0) {
    return [context.request.id];
  }

  return [];
}

function registerSatchelCommand(sdk: FrontendSDK) {
  sdk.commands.register(Commands.add, {
    name: "Add to Satchel",
    group: "Satchel",
    run: (context) => {
      void addRequestsFromContext(sdk, context);
    },
  });

  sdk.menu.registerItem({
    type: "RequestRow",
    commandId: Commands.add,
    leadingIcon: "fas fa-suitcase",
  });

  sdk.menu.registerItem({
    type: "Request",
    commandId: Commands.add,
    leadingIcon: "fas fa-suitcase",
  });

  sdk.menu.registerItem({
    type: "Response",
    commandId: Commands.add,
    leadingIcon: "fas fa-suitcase",
  });
}

async function addRequestsFromContext(sdk: FrontendSDK, context: CommandContext) {
  const requestIds = getRequestIdsFromContext(context);

  if (requestIds.length === 0) {
    sdk.window.showToast("No saved request selected", {
      variant: "warning",
    });
    return;
  }

  try {
    const result = await sdk.backend.addRequests(requestIds);
    const skippedMessage =
      result.skipped > 0
        ? ` (${result.skipped} duplicate or unavailable request${result.skipped === 1 ? "" : "s"} skipped)`
        : "";

    sdk.window.showToast(
      `Added ${result.added} request${result.added === 1 ? "" : "s"} to Satchel${skippedMessage}`,
      {
        variant: result.added > 0 ? "success" : "warning",
      },
    );
  } catch (err) {
    sdk.window.showToast(err instanceof Error ? err.message : "Failed to add request to Satchel", {
      variant: "error",
    });
  }
}

export const init = (sdk: FrontendSDK) => {
  registerSatchelCommand(sdk);

  const app = createApp(App);

  app.use(PrimeVue, {
    unstyled: true,
    pt: Classic,
  });

  app.use(SDKPlugin, sdk);

  const root = document.createElement("div");
  Object.assign(root.style, {
    height: "100%",
    width: "100%",
  });
  root.id = "plugin--frontend-vue";

  app.mount(root);

  sdk.navigation.addPage("/satchel", {
    body: root,
  });

  sdk.sidebar.registerItem("Satchel", "/satchel", {
    icon: "fas fa-suitcase",
  });
};
