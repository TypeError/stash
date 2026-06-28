import { Classic } from "@caido/primevue";
import PrimeVue from "primevue/config";
import { createApp } from "vue";

import { SDKPlugin } from "./plugins/sdk";
import "./styles/index.css";
import type { FrontendSDK } from "./types";
import App from "./views/App.vue";

import Tooltip from "primevue/tooltip";

const Commands = {
  open: "stash.open",
  stashRequest: "stash.request",
  stashSelectedRequests: "stash.selectedRequests",
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

function registerStashCommands(sdk: FrontendSDK) {
  sdk.commands.register(Commands.open, {
    name: "Open Stash",
    group: "Stash",
    run: () => {
      sdk.navigation.goTo("/stash");
    },
  });

  sdk.commandPalette.register(Commands.open);

  sdk.commands.register(Commands.stashSelectedRequests, {
    name: "Stash selected requests",
    group: "Stash",
    run: (context) => {
      void stashRequestsFromContext(sdk, context);
    },
    when: (context) =>
      context.type === "RequestRowContext" && getRequestIdsFromContext(context).length > 0,
  });

  sdk.commands.register(Commands.stashRequest, {
    name: "Stash request",
    group: "Stash",
    run: (context) => {
      void stashRequestsFromContext(sdk, context);
    },
    when: (context) =>
      context.type === "ResponseContext" && getRequestIdsFromContext(context).length > 0,
  });

  sdk.menu.registerItem({
    type: "RequestRow",
    commandId: Commands.stashSelectedRequests,
    leadingIcon: "fas fa-bookmark",
  });

  sdk.menu.registerItem({
    type: "Response",
    commandId: Commands.stashRequest,
    leadingIcon: "fas fa-bookmark",
  });
}

async function stashRequestsFromContext(sdk: FrontendSDK, context: CommandContext) {
  const requestIds = getRequestIdsFromContext(context);

  if (requestIds.length === 0) {
    sdk.window.showToast("No request selected to stash.", {
      variant: "warning",
    });
    return;
  }

  try {
    const result = await sdk.backend.stashRequests(requestIds);

    if (result.kind === "Error") {
      sdk.window.showToast(result.error, { variant: "error" });
      return;
    }

    const stashResult = result.value;
    const skippedMessage =
      stashResult.skipped > 0
        ? ` ${stashResult.skipped} duplicate or unavailable request${
            stashResult.skipped === 1 ? "" : "s"
          } skipped.`
        : "";

    sdk.window.showToast(
      `Stashed ${stashResult.stashed} request${stashResult.stashed === 1 ? "" : "s"}.${skippedMessage}`,
      {
        variant: stashResult.stashed > 0 ? "success" : "warning",
      },
    );
  } catch (err) {
    sdk.window.showToast(err instanceof Error ? err.message : "Could not stash request.", {
      variant: "error",
    });
  }
}

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
  root.id = "plugin--frontend-vue";

  app.mount(root);

  sdk.navigation.addPage("/stash", {
    body: root,
  });

  sdk.sidebar.registerItem("Stash", "/stash", {
    icon: "fas fa-box",
  });
};
