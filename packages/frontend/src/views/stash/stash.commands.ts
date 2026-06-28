import type { CommandContext } from "@caido/sdk-frontend";
import type { StashRequestInput } from "backend";

import type { FrontendSDK } from "@/types";

const Commands = {
  open: "stash.open",
  stashSelectedRequests: "stash.selected-requests",
  stashRequest: "stash.request",
} as const;

const StashSelectedRequestsUnavailableMessage =
  "Select one or more HTTP History requests, then use the context menu to stash them.";
const StashRequestUnavailableMessage =
  "Open a request or use the HTTP History context menu to stash it.";

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

function getStashResultMessage(stashed: number, skipped: number): string {
  const stashedMessage =
    stashed > 0 ? `Stashed ${stashed} request${stashed === 1 ? "" : "s"}.` : "";

  if (skipped === 0) {
    return stashedMessage;
  }

  if (stashed === 0) {
    return skipped === 1
      ? "Request already stashed or unavailable."
      : `${skipped} requests already stashed or unavailable.`;
  }

  return `${stashedMessage} ${skipped} already stashed or unavailable request${
    skipped === 1 ? "" : "s"
  } skipped.`;
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

function showStashResult(sdk: FrontendSDK, stashResult: { stashed: number; skipped: number }) {
  sdk.window.showToast(getStashResultMessage(stashResult.stashed, stashResult.skipped), {
    variant: stashResult.stashed > 0 ? "success" : "warning",
  });
}

async function stashRequestInputs(sdk: FrontendSDK, inputs: StashRequestInput[]) {
  try {
    const result = await sdk.backend.stashRequests(inputs);

    if (result.kind === "Error") {
      sdk.window.showToast(result.error, { variant: "error" });
      return;
    }

    showStashResult(sdk, result.value);
  } catch (err) {
    sdk.window.showToast(err instanceof Error ? err.message : "Could not stash request.", {
      variant: "error",
    });
  }
}

async function stashRequestsFromContext(
  sdk: FrontendSDK,
  context: CommandContext,
  unavailableMessage: string,
) {
  const inputs = getStashRequestInputsFromContext(sdk, context);

  if (inputs.length === 0) {
    sdk.window.showToast(unavailableMessage, {
      variant: "warning",
    });
    return;
  }

  await stashRequestInputs(sdk, inputs);
}

async function stashSelectedHttpHistoryRequests(sdk: FrontendSDK) {
  const httpHistoryIds = getSelectedHttpHistoryIds(sdk);

  if (httpHistoryIds.length === 0) {
    sdk.window.showToast(StashSelectedRequestsUnavailableMessage, {
      variant: "warning",
    });
    return;
  }

  try {
    const result = await sdk.backend.stashHttpHistoryRequests(httpHistoryIds);

    if (result.kind === "Error") {
      sdk.window.showToast(result.error, { variant: "error" });
      return;
    }

    showStashResult(sdk, result.value);
  } catch (err) {
    sdk.window.showToast(
      err instanceof Error ? err.message : "Could not stash selected requests.",
      {
        variant: "error",
      },
    );
  }
}

async function stashPrimaryHttpHistoryRequest(sdk: FrontendSDK) {
  const httpHistoryId = getPrimaryHttpHistoryId(sdk);

  if (httpHistoryId === undefined) {
    sdk.window.showToast(StashRequestUnavailableMessage, {
      variant: "warning",
    });
    return;
  }

  try {
    const result = await sdk.backend.stashHttpHistoryRequests([httpHistoryId]);

    if (result.kind === "Error") {
      sdk.window.showToast(result.error, { variant: "error" });
      return;
    }

    showStashResult(sdk, result.value);
  } catch (err) {
    sdk.window.showToast(err instanceof Error ? err.message : "Could not stash request.", {
      variant: "error",
    });
  }
}

async function stashSelectedRequestsFromCommand(sdk: FrontendSDK, context: CommandContext) {
  if (context.type === "BaseContext") {
    await stashSelectedHttpHistoryRequests(sdk);
    return;
  }

  if (context.type !== "RequestRowContext") {
    sdk.window.showToast(StashSelectedRequestsUnavailableMessage, {
      variant: "warning",
    });
    return;
  }

  await stashRequestsFromContext(sdk, context, StashSelectedRequestsUnavailableMessage);
}

async function stashRequestFromCommand(sdk: FrontendSDK, context: CommandContext) {
  if (context.type === "BaseContext") {
    await stashPrimaryHttpHistoryRequest(sdk);
    return;
  }

  if (context.type !== "RequestContext" && context.type !== "ResponseContext") {
    sdk.window.showToast(StashRequestUnavailableMessage, {
      variant: "warning",
    });
    return;
  }

  await stashRequestsFromContext(sdk, context, StashRequestUnavailableMessage);
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
      void stashSelectedRequestsFromCommand(sdk, context);
    },
    when: (context) => context.type === "BaseContext" || context.type === "RequestRowContext",
  });

  sdk.commandPalette.register(Commands.stashSelectedRequests);

  sdk.commands.register(Commands.stashRequest, {
    name: "Stash request",
    group: "Stash",
    run: (context) => {
      void stashRequestFromCommand(sdk, context);
    },
    when: (context) =>
      context.type === "BaseContext" ||
      ((context.type === "RequestContext" || context.type === "ResponseContext") &&
        getStashRequestInputsFromContext(sdk, context).length > 0),
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
