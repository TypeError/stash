<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";

import { useSDK } from "@/plugins/sdk";
import StashDetailDialog from "./StashDetailDialog.vue";
import StashEmptyState from "./StashEmptyState.vue";
import StashTable from "./StashTable.vue";
import StashToolbar from "./StashToolbar.vue";
import {
  clearStash,
  getStashedRequest,
  unstashRequest as unstashItem,
  listStashedRequests,
} from "./stash.api.js";
import {
  getUniqueHttpHistoryIds,
  isHttpHistoryId,
  showHttpHistoryRow,
  showHttpHistoryRows,
} from "./stash.httpHistory.js";
import { openRequestInReplay } from "./stash.replay.js";
import type { StashDetail, StashItem } from "./stash.types.js";

const sdk = useSDK();

const items = ref<StashItem[]>([]);
const loading = ref(false);
const error = ref<string>();
const searchQuery = ref("");
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailError = ref<string>();
const selectedDetail = ref<StashDetail>();

const stashedHttpHistoryIds = computed(() => {
  return getUniqueHttpHistoryIds(items.value);
});

const canShowStashedInHttpHistory = computed(() => {
  return stashedHttpHistoryIds.value.length > 0;
});

const normalizedSearchQuery = computed(() => {
  return searchQuery.value.trim().toLowerCase();
});

const filteredItems = computed(() => {
  const query = normalizedSearchQuery.value;

  if (query === "") {
    return items.value;
  }

  return items.value.filter((item) => {
    const values = [
      item.httpHistoryId,
      item.requestId,
      item.method,
      item.host,
      item.path,
      item.url,
    ];

    return values.some((value) => value !== undefined && value.toLowerCase().includes(query));
  });
});

const tableEmptyMessage = computed(() => {
  return normalizedSearchQuery.value === ""
    ? "No requests stashed yet."
    : "No matching stashed requests.";
});

const tableEmptyDescription = computed(() => {
  return normalizedSearchQuery.value === ""
    ? "Stash requests from HTTP History to keep them easy to find later."
    : "Try a different ID, method, host, path, or URL.";
});

function handleOpenInHttpHistory(item: StashItem) {
  const activeSdk = sdk;

  if (activeSdk === undefined) {
    error.value = "Caido SDK is not available";
    return;
  }

  if (!isHttpHistoryId(item.httpHistoryId)) {
    activeSdk.window.showToast("HTTP History row ID is unavailable.", {
      variant: "error",
    });
    return;
  }

  showHttpHistoryRow(activeSdk, item.httpHistoryId);
}

function handleShowStashedInHttpHistory() {
  const activeSdk = sdk;

  if (activeSdk === undefined) {
    error.value = "Caido SDK is not available";
    return;
  }

  if (stashedHttpHistoryIds.value.length === 0) {
    activeSdk.window.showToast("No stashed requests can be shown in HTTP History.", {
      variant: "error",
    });
    return;
  }

  showHttpHistoryRows(activeSdk, stashedHttpHistoryIds.value);
}

async function handleOpenDetails(item: StashItem) {
  if (sdk === undefined) {
    error.value = "Caido SDK is not available";
    return;
  }

  detailVisible.value = true;
  detailLoading.value = true;
  detailError.value = undefined;
  selectedDetail.value = undefined;

  try {
    const result = await getStashedRequest(sdk, item.id);

    if (result.kind === "Error") {
      detailError.value = result.error;
      return;
    }

    if (result.value === undefined) {
      detailError.value =
        "Request details unavailable. This Stash entry still exists, but the original HTTP History request could not be loaded.";
      return;
    }

    selectedDetail.value = result.value;
  } catch (err) {
    detailError.value = err instanceof Error ? err.message : "Could not load request details.";
  } finally {
    detailLoading.value = false;
  }
}

async function loadItems() {
  if (sdk === undefined) {
    error.value = "Caido SDK is not available";
    return;
  }

  loading.value = true;
  error.value = undefined;

  try {
    const result = await listStashedRequests(sdk, 100, 0);

    if (result.kind === "Error") {
      error.value = result.error;
      return;
    }

    items.value = result.value;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not load stashed requests.";
  } finally {
    loading.value = false;
  }
}

async function handleUnstash(item: StashItem) {
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

    if (result.value.unstashed) {
      await loadItems();
      if (selectedDetail.value?.id === item.id) {
        detailVisible.value = false;
        selectedDetail.value = undefined;
      }
      sdk.window.showToast("Unstashed request.", { variant: "success" });
    }
  } catch (err) {
    sdk.window.showToast(err instanceof Error ? err.message : "Could not unstash request.", {
      variant: "error",
    });
  }
}

async function handleClear() {
  if (sdk === undefined) {
    error.value = "Caido SDK is not available";
    return;
  }

  const confirmed = window.confirm("Clear all stashed requests from Stash?");

  if (!confirmed) {
    return;
  }

  try {
    const result = await clearStash(sdk);

    if (result.kind === "Error") {
      sdk.window.showToast(result.error, { variant: "error" });
      return;
    }

    await loadItems();
    detailVisible.value = false;
    selectedDetail.value = undefined;
    sdk.window.showToast("Cleared Stash.", {
      variant: "success",
    });
  } catch (err) {
    sdk.window.showToast(err instanceof Error ? err.message : "Could not clear Stash.", {
      variant: "error",
    });
  }
}

async function handleReplay(item: StashItem) {
  if (sdk === undefined) {
    error.value = "Caido SDK is not available";
    return;
  }

  try {
    await openRequestInReplay(sdk, item.requestId);
  } catch (err) {
    sdk.window.showToast(err instanceof Error ? err.message : "Could not send request to Replay.", {
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
        :can-show-stashed="canShowStashedInHttpHistory"
        :count="items.length"
        :loading="loading"
        :search-query="searchQuery"
        @clear="handleClear"
        @refresh="loadItems"
        @show-stashed="handleShowStashedInHttpHistory"
        @update:search-query="searchQuery = $event"
      />

      <div
        v-if="error !== undefined"
        class="rounded border border-danger-700 bg-danger-900/20 px-3 py-2 text-sm text-danger-200"
        role="alert"
      >
        {{ error }}
      </div>

      <StashEmptyState v-else-if="!loading && items.length === 0" />

      <div v-else class="min-h-0 flex-1 overflow-auto">
        <StashTable
          :empty-description="tableEmptyDescription"
          :empty-message="tableEmptyMessage"
          :items="filteredItems"
          :loading="loading"
          @details="handleOpenDetails"
          @view="handleOpenInHttpHistory"
          @replay="handleReplay"
          @unstash="handleUnstash"
        />
      </div>

      <StashDetailDialog
        v-model:visible="detailVisible"
        :detail="selectedDetail"
        :error="detailError"
        :loading="detailLoading"
      />
    </div>
  </main>
</template>
