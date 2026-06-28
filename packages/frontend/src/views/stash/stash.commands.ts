import type { CommandContext } from "@caido/sdk-frontend";
import type { StashRequestInput } from "backend";

import type { FrontendSDK } from "@/types";

const Commands = {
  open: "stash.open",
  stashSelectedRequests: "stash.selected-requests",
  stashRequest: "stash.request",
} as const;

function getSelectedHttpHistoryIds(sdk: FrontendSDK): string[] {
  const context = sdk.window.getContext();

  if (context.page?.kind !== "HTTPHistory" || context.page.selection.kind === "Empty") {
    return [];
  }

  return [context.page.selection.main, ...context.page.selection.secondary].map(String);
}

function getPrimaryHttpHistoryId(sdk: FrontendSDK): string | undefined {
  return getSelectedHttpHistoryIds(sdk)[0];
}

function getStashRequestInput(
  request: {
    id: string | number;
  },
  httpHistoryId: string | undefined,
): StashRequestInput {
  return {
    requestId: String(request.id),
    httpHistoryId,
  };
}

function dedupeStashRequestInputs(inputs: StashRequestInput[]): StashRequestInput[] {
  const seenRequestIds = new Set<string>();

  return inputs.filter((input) => {
    if (seenRequestIds.has(input.requestId)) {
      return false;
    }

    seenRequestIds.add(input.requestId);
    return true;
  });
}

function getStashRequestInputsFromContext(
  sdk: FrontendSDK,
  context: CommandContext,
): StashRequestInput[] {
  if (context.type === "RequestRowContext") {
    const selectedHttpHistoryIds = getSelectedHttpHistoryIds(sdk);
    const hasMatchingSelection = selectedHttpHistoryIds.length === context.requests.length;

    return dedupeStashRequestInputs(
      context.requests.map((request, index) =>
        getStashRequestInput(
          request,
          hasMatchingSelection ? selectedHttpHistoryIds[index] : undefined,
        ),
      ),
    );
  }

  if (context.type === "RequestContext") {
    if (context.request.type !== "RequestFull") {
      return [];
    }

    return [getStashRequestInput(context.request, getPrimaryHttpHistoryId(sdk))];
  }

  if (context.type === "ResponseContext") {
    return [getStashRequestInput(context.request, getPrimaryHttpHistoryId(sdk))];
  }

  return [];
}

async function stashRequestsFromContext(sdk: FrontendSDK, context: CommandContext) {
  const inputs = getStashRequestInputsFromContext(sdk, context);

  if (inputs.length === 0) {
    sdk.window.showToast("No request selected to stash.", {
      variant: "warning",
    });
    return;
  }

  try {
    const result = await sdk.backend.stashRequests(inputs);

    if (result.kind === "Error") {
      sdk.window.showToast(result.error, { variant: "error" });
      return;
    }

    const stashResult = result.value;
    const skippedMessage =
      stashResult.skipped > 0
        ? ` ${stashResult.skipped} already stashed or unavailable request${
            stashResult.skipped === 1 ? "" : "s"
          } skipped.`
        : "";

    sdk.window.showToast(
      `Stashed ${stashResult.stashed} request${
        stashResult.stashed === 1 ? "" : "s"
      }.${skippedMessage}`,
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

export function registerStashCommands(sdk: FrontendSDK) {
  sdk.commands.register(Commands.open, {
    name: "Open Stash",
    group: "Stash",
    run: () => {
      sdk.navigation.goTo("/stash");
    },
  });

  sdk.commandPalette.register(Commands.open);
  sdk.shortcuts.register(Commands.open, ["Alt", "Shift", "S"]);

  sdk.commands.register(Commands.stashSelectedRequests, {
    name: "Stash selected requests",
    group: "Stash",
    run: (context) => {
      void stashRequestsFromContext(sdk, context);
    },
    when: (context) =>
      context.type === "RequestRowContext" &&
      getStashRequestInputsFromContext(sdk, context).length > 0,
  });

  sdk.commandPalette.register(Commands.stashSelectedRequests);

  sdk.commands.register(Commands.stashRequest, {
    name: "Stash request",
    group: "Stash",
    run: (context) => {
      void stashRequestsFromContext(sdk, context);
    },
    when: (context) =>
      (context.type === "RequestContext" || context.type === "ResponseContext") &&
      getStashRequestInputsFromContext(sdk, context).length > 0,
  });

  sdk.commandPalette.register(Commands.stashRequest);

  sdk.menu.registerItem({
    type: "RequestRow",
    commandId: Commands.stashSelectedRequests,
    leadingIcon: "fas fa-box",
  });

  sdk.menu.registerItem({
    type: "Request",
    commandId: Commands.stashRequest,
    leadingIcon: "fas fa-box",
  });

  sdk.menu.registerItem({
    type: "Response",
    commandId: Commands.stashRequest,
    leadingIcon: "fas fa-box",
  });
}
