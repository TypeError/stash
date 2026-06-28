<script setup lang="ts">
import Card from "primevue/card";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import { onMounted, onUnmounted, ref } from "vue";

import { useSDK } from "@/plugins/sdk";
import SatchelDetailPanel from "./SatchelDetailPanel.vue";
import SatchelEmptyState from "./SatchelEmptyState.vue";
import SatchelTable from "./SatchelTable.vue";
import SatchelToolbar from "./SatchelToolbar.vue";
import { clearSatchelItems, deleteSatchelItem, listSatchelItems } from "./satchel.api";
import type { SatchelItem } from "./satchel.types";

const sdk = useSDK();

const items = ref<SatchelItem[]>([]);
const selectedItem = ref<SatchelItem>();
const loading = ref(false);
const error = ref<string>();

async function loadItems() {
  if (sdk === undefined) {
    error.value = "Caido SDK is not available";
    return;
  }

  loading.value = true;
  error.value = undefined;

  try {
    const result = await listSatchelItems(sdk, 100, 0);

    if (result.kind === "Error") {
      error.value = result.error;
      return;
    }

    items.value = result.value;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load Satchel items";
  } finally {
    loading.value = false;
  }
}

async function handleDelete(item: SatchelItem) {
  if (sdk === undefined) {
    error.value = "Caido SDK is not available";
    return;
  }

  try {
    const result = await deleteSatchelItem(sdk, item.id);

    if (result.kind === "Error") {
      sdk.window.showToast(result.error, { variant: "error" });
      return;
    }

    if (result.value.deleted) {
      if (selectedItem.value?.id === item.id) {
        selectedItem.value = undefined;
      }

      await loadItems();
      sdk.window.showToast("Deleted Satchel item", { variant: "success" });
    }
  } catch (err) {
    sdk.window.showToast(err instanceof Error ? err.message : "Failed to delete Satchel item", {
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
    "Clear all saved Satchel requests? This only removes them from Satchel and does not delete Caido HTTP History.",
  );

  if (!confirmed) {
    return;
  }

  try {
    const result = await clearSatchelItems(sdk);

    if (result.kind === "Error") {
      sdk.window.showToast(result.error, { variant: "error" });
      return;
    }

    selectedItem.value = undefined;
    await loadItems();
    sdk.window.showToast(
      `Cleared ${result.value.deletedItems} Satchel item${result.value.deletedItems === 1 ? "" : "s"}`,
      {
        variant: "success",
      },
    );
  } catch (err) {
    sdk.window.showToast(err instanceof Error ? err.message : "Failed to clear Satchel items", {
      variant: "error",
    });
  }
}

const eventSubscription = sdk?.backend.onEvent("satchel-updated", () => {
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
    <SatchelToolbar
      :count="items.length"
      :loading="loading"
      @clear="handleClear"
      @refresh="loadItems"
    />

    <p v-if="error !== undefined" class="m-0 text-sm text-red-400">{{ error }}</p>

    <SatchelEmptyState v-else-if="!loading && items.length === 0" />

    <Splitter v-else class="h-[calc(100%-4rem)]">
      <SplitterPanel :size="62" :min-size="40">
        <div class="h-full overflow-auto pr-3">
          <SatchelTable
            :items="items"
            :loading="loading"
            @view="selectedItem = $event"
            @delete="handleDelete"
          />
        </div>
      </SplitterPanel>

      <SplitterPanel :size="38" :min-size="25">
        <div class="h-full pl-3">
          <SatchelDetailPanel :item="selectedItem" @close="selectedItem = undefined" />

          <Card
            v-if="selectedItem === undefined"
            class="h-full"
            :pt="{
              body: { class: 'h-full p-0' },
              content: { class: 'h-full flex items-center justify-center p-6' },
            }"
          >
            <template #content>
              <div class="max-w-sm text-center">
                <i class="fas fa-eye mb-3 text-xl text-surface-500" aria-hidden="true" />
                <h2 class="m-0 text-base font-semibold">Select a saved request</h2>
                <p class="mt-2 mb-0 text-sm text-surface-400">
                  Request and response details load from Caido when you click View.
                </p>
              </div>
            </template>
          </Card>
        </div>
      </SplitterPanel>
    </Splitter>
  </main>
</template>
