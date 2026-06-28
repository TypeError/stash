<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

import { useSDK } from "@/plugins/sdk";
import StashEmptyState from "./StashEmptyState.vue";
import StashTable from "./StashTable.vue";
import StashToolbar from "./StashToolbar.vue";
import { clearStashItems, deleteStashItem as unstashItem, listStashItems } from "./stash.api.js";
import {
  getUniqueHttpHistoryRowIds,
  isHttpHistoryRowId,
  showHttpHistoryRow,
  showHttpHistoryRows,
} from "./stash.httpHistory.js";
import type { StashItem } from "./stash.types.js";

const sdk = useSDK();

const items = ref<StashItem[]>([]);
const loading = ref(false);
const error = ref<string>();

function handleOpenInHttpHistory(item: StashItem) {
  const activeSdk = sdk;

  if (activeSdk === undefined) {
    error.value = "Caido SDK is not available";
    return;
  }

  if (!isHttpHistoryRowId(item.caidoRequestId)) {
    activeSdk.window.showToast("Stashed request is missing a valid HTTP History row id.", {
      variant: "error",
    });
    return;
  }

  showHttpHistoryRow(activeSdk, item.caidoRequestId);
}

function handleShowStashedInHttpHistory() {
  const activeSdk = sdk;

  if (activeSdk === undefined) {
    error.value = "Caido SDK is not available";
    return;
  }

  const rowIds = getUniqueHttpHistoryRowIds(items.value);

  if (rowIds.length === 0) {
    activeSdk.window.showToast("No stashed requests can be shown in HTTP History.", {
      variant: "error",
    });
    return;
  }

  showHttpHistoryRows(activeSdk, rowIds);
}

async function loadItems() {
  if (sdk === undefined) {
    error.value = "Caido SDK is not available";
    return;
  }

  loading.value = true;
  error.value = undefined;

  try {
    const result = await listStashItems(sdk, 100, 0);

    if (result.kind === "Error") {
      error.value = result.error;
      return;
    }

    items.value = result.value;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load Stash items";
  } finally {
    loading.value = false;
  }
}

async function handleDelete(item: StashItem) {
  if (sdk === undefined) {
    error.value = "Caido SDK is not available";
    return;
  }

  try {
    const result = await unstashItem(sdk, item.id);

    if (result.kind === "Error") {
      sdk.window.showToast(result.error, { variant: "error" });
      return;
    }

    if (result.value.deleted) {
      await loadItems();
      sdk.window.showToast("Unstashed request", { variant: "success" });
    }
  } catch (err) {
    sdk.window.showToast(err instanceof Error ? err.message : "Failed to unstash request", {
      variant: "error",
    });
  }
}

async function handleClear() {
  if (sdk === undefined) {
    error.value = "Caido SDK is not available";
    return;
  }

  const confirmed = window.confirm(
    "Clear all stashed requests? This only removes them from Stash and does not delete Caido HTTP History.",
  );

  if (!confirmed) {
    return;
  }

  try {
    const result = await clearStashItems(sdk);

    if (result.kind === "Error") {
      sdk.window.showToast(result.error, { variant: "error" });
      return;
    }

    await loadItems();
    sdk.window.showToast(
      `Cleared ${result.value.deletedItems} stashed request${result.value.deletedItems === 1 ? "" : "s"}`,
      {
        variant: "success",
      },
    );
  } catch (err) {
    sdk.window.showToast(err instanceof Error ? err.message : "Failed to clear stashed requests", {
      variant: "error",
    });
  }
}

const eventSubscription = sdk?.backend.onEvent("stash-updated", () => {
  void loadItems();
});

onMounted(() => {
  void loadItems();
});

onUnmounted(() => {
  eventSubscription?.stop();
});
</script>

<template>
  <main class="box-border h-full overflow-hidden p-4 text-surface-100">
    <div class="flex h-full flex-col gap-4">
      <StashToolbar
        :count="items.length"
        :loading="loading"
        @clear="handleClear"
        @refresh="loadItems"
      />

      <p v-if="error !== undefined" class="m-0 text-sm text-red-400">{{ error }}</p>

      <StashEmptyState v-else-if="!loading && items.length === 0" />

      <div v-else class="min-h-0 flex-1 overflow-auto">
        <StashTable
          :items="items"
          :loading="loading"
          @open="handleOpenInHttpHistory"
          @show-stashed="handleShowStashedInHttpHistory"
          @delete="handleDelete"
        />
      </div>
    </div>
  </main>
</template>
