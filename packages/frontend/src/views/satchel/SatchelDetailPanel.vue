<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import { computed, defineEmits, defineProps, ref, watch } from "vue";

import { useSDK } from "@/plugins/sdk";
import { getSatchelItem } from "./satchel.api";
import { formatHeaderValues } from "./satchel.format";
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

      detail.value = result.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load Satchel item";
    } finally {
      loading.value = false;
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
          <h2 class="m-0 text-base font-semibold">Request detail</h2>
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
        <p v-if="loading" class="m-0 text-sm text-surface-400">Loading...</p>
        <p v-else-if="error !== undefined" class="m-0 text-sm text-red-400">
          {{ error }}
        </p>

        <div v-else-if="detail !== undefined" class="grid gap-4">
          <section
            v-if="!detail.available"
            class="rounded border border-yellow-700 bg-surface-800 p-3 text-sm text-yellow-300"
          >
            Original Caido request is unavailable. Satchel only stored the bookmark metadata.
          </section>

          <section>
            <h3 class="mt-0 mb-2 text-sm font-semibold">Summary</h3>
            <dl class="grid gap-2 m-0 text-sm">
              <div class="grid grid-cols-[8rem_1fr] gap-4">
                <dt class="text-surface-400">Method</dt>
                <dd class="m-0 break-words">
                  {{ detail.method !== undefined ? detail.method : "-" }}
                </dd>
              </div>
              <div class="grid grid-cols-[8rem_1fr] gap-4">
                <dt class="text-surface-400">URL</dt>
                <dd class="m-0 break-words">
                  {{ detail.url !== undefined ? detail.url : "-" }}
                </dd>
              </div>
              <div class="grid grid-cols-[8rem_1fr] gap-4">
                <dt class="text-surface-400">Host</dt>
                <dd class="m-0 break-words">
                  {{ detail.host !== undefined && detail.host.length > 0 ? detail.host : "-" }}
                </dd>
              </div>
              <div class="grid grid-cols-[8rem_1fr] gap-4">
                <dt class="text-surface-400">Status</dt>
                <dd class="m-0">
                  {{ detail.response?.statusCode ?? "-" }}
                </dd>
              </div>
            </dl>
          </section>

          <section v-if="detail.available">
            <h3 class="mt-0 mb-2 text-sm font-semibold">Request headers</h3>
            <table class="w-full border-collapse text-sm">
              <tbody>
                <tr v-for="[name, values] in requestHeaders" :key="name">
                  <th
                    class="w-48 border-b border-surface-700 py-2 pr-4 text-left align-top font-medium text-surface-400"
                  >
                    {{ name }}
                  </th>
                  <td class="border-b border-surface-700 py-2 align-top">
                    {{ formatHeaderValues(values) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section v-if="detail.available">
            <h3 class="mt-0 mb-2 text-sm font-semibold">Request body</h3>
            <pre
              class="m-0 max-h-96 overflow-auto rounded border border-surface-700 p-3 text-xs whitespace-pre-wrap"
              >{{
                detail.request?.bodyText !== undefined && detail.request.bodyText.length > 0
                  ? detail.request.bodyText
                  : "No body"
              }}</pre
            >
          </section>

          <section v-if="detail.available">
            <h3 class="mt-0 mb-2 text-sm font-semibold">Raw request</h3>
            <pre
              class="m-0 max-h-96 overflow-auto rounded border border-surface-700 p-3 text-xs whitespace-pre-wrap"
              >{{
                detail.request?.rawRequest !== undefined && detail.request.rawRequest.length > 0
                  ? detail.request.rawRequest
                  : "No raw request available"
              }}</pre
            >
          </section>

          <section v-if="detail.available && detail.response === undefined">
            <h3 class="mt-0 mb-2 text-sm font-semibold">Response</h3>
            <p class="m-0 text-sm text-surface-400">No response available.</p>
          </section>

          <section v-if="detail.available && detail.response !== undefined">
            <h3 class="mt-0 mb-2 text-sm font-semibold">Response headers</h3>
            <table class="w-full border-collapse text-sm">
              <tbody>
                <tr v-for="[name, values] in responseHeaders" :key="name">
                  <th
                    class="w-48 border-b border-surface-700 py-2 pr-4 text-left align-top font-medium text-surface-400"
                  >
                    {{ name }}
                  </th>
                  <td class="border-b border-surface-700 py-2 align-top">
                    {{ formatHeaderValues(values) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section v-if="detail.available && detail.response !== undefined">
            <h3 class="mt-0 mb-2 text-sm font-semibold">Response body</h3>
            <pre
              class="m-0 max-h-96 overflow-auto rounded border border-surface-700 p-3 text-xs whitespace-pre-wrap"
              >{{
                detail.response?.bodyText !== undefined && detail.response.bodyText.length > 0
                  ? detail.response.bodyText
                  : "No response body"
              }}</pre
            >
          </section>
        </div>
      </div>
    </template>
  </Card>
</template>
