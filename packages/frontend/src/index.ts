import { Classic } from "@caido/primevue";
import PrimeVue from "primevue/config";
import { createApp } from "vue";

import { SDKPlugin } from "./plugins/sdk";
import "./styles/index.css";
import type { FrontendSDK } from "./types";
import App from "./views/App.vue";

const Commands = {
  add: "stash.add",
  open: "stash.open",
} as const;

type CommandContext =
  | { type: "BaseContext" }
  | {
      type: "RequestRowContext";
      requests: {
        id: string;
        host: string;
        port: number;
        path: string;
        query: string;
        isTls: boolean;
      }[];
    }
  | {
      type: "RequestContext";
      request: {
        host: string;
        port: number;
        path: string;
        query: string;
        isTls: boolean;
        raw: string;
      };
      selection: string;
    }
  | {
      type: "ResponseContext";
      request: {
        id: string;
        host: string;
        port: number;
        path: string;
        query: string;
        isTls: boolean;
      };
      response: {
        id: string;
        raw: string;
        statusCode: number;
        roundtripTime: number;
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

function registerStashCommand(sdk: FrontendSDK) {
  sdk.commands.register(Commands.open, {
    name: "Open Stash",
    group: "Stash",
    run: () => {
      sdk.navigation.goTo("/stash");
    },
  });

  sdk.commandPalette.register(Commands.open);

  sdk.commands.register(Commands.add, {
    name: "Add to Stash",
    group: "Stash",
    run: (context) => {
      void addRequestsFromContext(sdk, context);
    },
    when: (context) => getRequestIdsFromContext(context).length > 0,
  });

  sdk.menu.registerItem({
    type: "RequestRow",
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
    sdk.window.showToast("No stashed request selected", {
      variant: "warning",
    });
    return;
  }

  try {
    const result = await sdk.backend.addRequests(requestIds);
    if (result.kind === "Error") {
      sdk.window.showToast(result.error, { variant: "error" });
      return;
    }

    const addResult = result.value;
    const skippedMessage =
      addResult.skipped > 0
        ? ` (${addResult.skipped} duplicate or unavailable request${addResult.skipped === 1 ? "" : "s"} skipped)`
        : "";

    sdk.window.showToast(
      `Added ${addResult.added} request${addResult.added === 1 ? "" : "s"} to Stash${skippedMessage}`,
      {
        variant: addResult.added > 0 ? "success" : "warning",
      },
    );
  } catch (err) {
    sdk.window.showToast(err instanceof Error ? err.message : "Failed to add request to Stash", {
      variant: "error",
    });
  }
}

export const init = (sdk: FrontendSDK) => {
  registerStashCommand(sdk);

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

  sdk.navigation.addPage("/stash", {
    body: root,
  });

  sdk.sidebar.registerItem("Stash", "/stash", {
    icon: "fas fa-suitcase",
  });
};
