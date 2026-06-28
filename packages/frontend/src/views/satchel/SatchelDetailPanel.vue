<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import { computed, defineEmits, defineProps, ref, watch } from "vue";

import { useSDK } from "@/plugins/sdk";
import type { FrontendSDK } from "@/types";
import { getSatchelItem } from "./satchel.api";
import { formatHeaderValues, formatSavedAt } from "./satchel.format";
import type { SatchelDetail, SatchelItem } from "./satchel.types";

const props = defineProps<{
  item: SatchelItem | undefined;
}>();

defineEmits<{
  close: [];
}>();

const sdk = useSDK();
const detail = ref<SatchelDetail>();
const loading = ref(false);
const error = ref<string>();
const bodyPreviewLimit = 20_000;
const httpHistoryPath = "/http-history";

const originalRequestId = computed(() => props.item?.caidoRequestId);
const canOpenInHttpHistory = computed(() => {
  return (
    sdk !== undefined && originalRequestId.value !== undefined && originalRequestId.value.length > 0
  );
});
const summary = computed(() => detail.value ?? props.item);
const status = computed(() => detail.value?.response?.statusCode);

const requestHeaders = computed(() => {
  if (detail.value?.request === undefined) {
    return [];
  }

  return Object.entries(detail.value.request.headers);
});

const responseHeaders = computed(() => {
  if (detail.value?.response === undefined) {
    return [];
  }

  return Object.entries(detail.value.response.headers);
});

const requestBodyPreview = computed(() => {
  return formatBodyPreview(detail.value?.request?.bodyText, "No request body");
});

const rawRequestPreview = computed(() => {
  return formatBodyPreview(detail.value?.request?.rawRequest, "No raw request preview available");
});

const responseBodyPreview = computed(() => {
  return formatBodyPreview(detail.value?.response?.bodyText, "No response body");
});

function formatBodyPreview(body: string | undefined, emptyMessage: string) {
  if (body === undefined || body.length === 0) {
    return emptyMessage;
  }

  if (body.length <= bodyPreviewLimit) {
    return body;
  }

  return `${body.slice(0, bodyPreviewLimit)}\n\n[Preview truncated. Open in HTTP History to inspect the full body.]`;
}

function httpHistoryRequestQuery(
  requestId: string,
): Parameters<FrontendSDK["httpHistory"]["setQuery"]>[0] {
  const escapedRequestId = requestId.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return `req.id.eq:"${escapedRequestId}"` as Parameters<FrontendSDK["httpHistory"]["setQuery"]>[0];
}

function openInHttpHistory() {
  const requestId = originalRequestId.value;

  if (requestId === undefined || requestId.length === 0 || sdk === undefined) {
    return;
  }

  sdk.navigation.goTo(httpHistoryPath);

  requestAnimationFrame(() => {
    sdk.httpHistory.setQuery(httpHistoryRequestQuery(requestId));
  });
}

watch(
  () => props.item?.id,
  async (itemId) => {
    detail.value = undefined;
    error.value = undefined;

    if (itemId === undefined) {
      return;
    }

    if (sdk === undefined) {
      error.value = "Caido SDK is not available";
      return;
    }

    loading.value = true;

    try {
      const result = await getSatchelItem(sdk, itemId);

      if (result.kind === "Error") {
        error.value = result.error;
        return;
      }

      if (result.value === undefined) {
        error.value = "Satchel item not found";
        return;
      }

      if (props.item?.id !== itemId) {
        return;
      }

      detail.value = result.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load Satchel item";
    } finally {
      if (props.item?.id === itemId) {
        loading.value = false;
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <Card
    v-if="item !== undefined"
    class="h-full"
    :pt="{
      body: { class: 'h-full p-0' },
      content: { class: 'h-full flex flex-col' },
    }"
  >
    <template #content>
      <header class="flex items-start justify-between gap-4 border-b border-surface-700 p-4">
        <div class="min-w-0">
          <h2 class="m-0 text-base font-semibold">Saved request preview</h2>
          <p class="mt-1 mb-0 text-sm text-surface-400 break-words">
            {{ item.method !== undefined ? item.method : "-" }}
            {{ item.url !== undefined ? item.url : "-" }}
          </p>
        </div>

        <Button
          type="button"
          icon="fas fa-xmark"
          aria-label="Close"
          severity="secondary"
          size="small"
          @click="$emit('close')"
        />
      </header>

      <div class="flex-1 overflow-auto p-4">
        <div class="grid gap-4">
          <section class="grid gap-2">
            <Button
              type="button"
              label="Open in HTTP History"
              icon="fas fa-arrow-up-right-from-square"
              class="justify-self-start"
              :disabled="!canOpenInHttpHistory"
              @click="openInHttpHistory"
            />

            <p
              v-if="originalRequestId === undefined || originalRequestId.length === 0"
              class="m-0 text-sm text-surface-400"
            >
              Original request id is missing.
            </p>
            <p v-else-if="sdk === undefined" class="m-0 text-sm text-surface-400">
              Caido SDK is not available.
            </p>
          </section>

          <section>
            <h3 class="mt-0 mb-2 text-sm font-semibold">Metadata</h3>
            <dl class="grid gap-2 m-0 text-sm">
              <div class="grid grid-cols-[8rem_1fr] gap-4">
                <dt class="text-surface-400">Method</dt>
                <dd class="m-0 break-words">
                  {{ summary?.method !== undefined ? summary.method : "-" }}
                </dd>
              </div>
              <div class="grid grid-cols-[8rem_1fr] gap-4">
                <dt class="text-surface-400">URL</dt>
                <dd class="m-0 break-words">
                  {{ summary?.url !== undefined ? summary.url : "-" }}
                </dd>
              </div>
              <div class="grid grid-cols-[8rem_1fr] gap-4">
                <dt class="text-surface-400">Host</dt>
                <dd class="m-0 break-words">
                  {{ summary?.host !== undefined && summary.host.length > 0 ? summary.host : "-" }}
                </dd>
              </div>
              <div class="grid grid-cols-[8rem_1fr] gap-4">
                <dt class="text-surface-400">Status</dt>
                <dd class="m-0">
                  {{ status ?? "-" }}
                </dd>
              </div>
              <div class="grid grid-cols-[8rem_1fr] gap-4">
                <dt class="text-surface-400">Request ID</dt>
                <dd class="m-0 break-words">
                  {{ item.caidoRequestId.length > 0 ? item.caidoRequestId : "-" }}
                </dd>
              </div>
              <div class="grid grid-cols-[8rem_1fr] gap-4">
                <dt class="text-surface-400">Created</dt>
                <dd class="m-0">
                  {{ formatSavedAt(item.createdAt) }}
                </dd>
              </div>
              <div class="grid grid-cols-[8rem_1fr] gap-4">
                <dt class="text-surface-400">Updated</dt>
                <dd class="m-0">
                  {{ formatSavedAt(item.updatedAt) }}
                </dd>
              </div>
            </dl>
          </section>

          <p v-if="loading" class="m-0 text-sm text-surface-400">Loading preview...</p>
          <p v-else-if="error !== undefined" class="m-0 text-sm text-red-400">
            {{ error }}
          </p>

          <section
            v-if="detail !== undefined && !detail.available"
            class="rounded border border-yellow-700 bg-surface-800 p-3 text-sm text-yellow-300"
          >
            Original Caido request is unavailable. Satchel only has the saved metadata.
          </section>

          <section v-if="detail !== undefined && detail.available">
            <h3 class="mt-0 mb-2 text-sm font-semibold">Request header preview</h3>
            <table v-if="requestHeaders.length > 0" class="w-full border-collapse text-sm">
              <tbody>
                <tr v-for="[name, values] in requestHeaders" :key="name">
                  <th
                    class="w-48 border-b border-surface-700 py-2 pr-4 text-left align-top font-medium text-surface-400"
                  >
                    {{ name }}
                  </th>
                  <td class="border-b border-surface-700 py-2 align-top break-words">
                    {{ formatHeaderValues(values) }}
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-else class="m-0 text-sm text-surface-400">No request headers available.</p>
          </section>

          <section v-if="detail !== undefined && detail.available">
            <h3 class="mt-0 mb-2 text-sm font-semibold">Request body preview</h3>
            <pre
              class="m-0 max-h-96 overflow-auto rounded border border-surface-700 p-3 text-xs whitespace-pre-wrap"
              >{{ requestBodyPreview }}</pre
            >
          </section>

          <section v-if="detail !== undefined && detail.available">
            <h3 class="mt-0 mb-2 text-sm font-semibold">Raw request preview</h3>
            <pre
              class="m-0 max-h-96 overflow-auto rounded border border-surface-700 p-3 text-xs whitespace-pre-wrap"
              >{{ rawRequestPreview }}</pre
            >
          </section>

          <section v-if="detail !== undefined && detail.available && detail.response === undefined">
            <h3 class="mt-0 mb-2 text-sm font-semibold">Response preview</h3>
            <p class="m-0 text-sm text-surface-400">No response available.</p>
          </section>

          <section v-if="detail !== undefined && detail.available && detail.response !== undefined">
            <h3 class="mt-0 mb-2 text-sm font-semibold">Response header preview</h3>
            <table v-if="responseHeaders.length > 0" class="w-full border-collapse text-sm">
              <tbody>
                <tr v-for="[name, values] in responseHeaders" :key="name">
                  <th
                    class="w-48 border-b border-surface-700 py-2 pr-4 text-left align-top font-medium text-surface-400"
                  >
                    {{ name }}
                  </th>
                  <td class="border-b border-surface-700 py-2 align-top break-words">
                    {{ formatHeaderValues(values) }}
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-else class="m-0 text-sm text-surface-400">No response headers available.</p>
          </section>

          <section v-if="detail !== undefined && detail.available && detail.response !== undefined">
            <h3 class="mt-0 mb-2 text-sm font-semibold">Response body preview</h3>
            <pre
              class="m-0 max-h-96 overflow-auto rounded border border-surface-700 p-3 text-xs whitespace-pre-wrap"
              >{{ responseBodyPreview }}</pre
            >
          </section>

          <section
            v-if="detail !== undefined && detail.available"
            class="rounded border border-surface-700 bg-surface-800 p-3 text-sm text-surface-300"
          >
            This preview is capped. Open in HTTP History to inspect the full request and response.
          </section>
        </div>
      </div>
    </template>
  </Card>
</template>
