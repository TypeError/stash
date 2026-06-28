<script setup lang="ts">
import Dialog from "primevue/dialog";
import { computed } from "vue";

import { formatHeaderValues, formatPathWithQuery, formatStashedAt } from "./stash.format";
import type { StashDetail } from "./stash.types";

const props = defineProps<{
  detail: StashDetail | undefined;
  error: string | undefined;
  loading: boolean;
  visible: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [visible: boolean];
}>();

const detailTitle = computed(() => {
  if (props.detail === undefined) {
    return "Stashed request details";
  }

  const method =
    props.detail.method !== undefined && props.detail.method !== ""
      ? props.detail.method.toUpperCase()
      : "REQUEST";
  return `${method} ${formatPathWithQuery(props.detail.path, props.detail.url)}`;
});

const requestHeaders = computed(() => {
  return props.detail?.request?.headers ?? {};
});

const responseHeaders = computed(() => {
  return props.detail?.response?.headers ?? {};
});

function formatText(value: string | undefined) {
  return value !== undefined && value.length > 0 ? value : "-";
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="detailTitle"
    :style="{ width: 'min(72rem, calc(100vw - 2rem))' }"
    :breakpoints="{ '960px': '92vw', '640px': '96vw' }"
    :pt="{
      content: { class: 'p-0' },
    }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="max-h-[75vh] overflow-auto p-4 text-sm text-surface-100">
      <div v-if="loading" class="py-8 text-center text-surface-400">Loading request details...</div>

      <div
        v-else-if="error !== undefined"
        class="rounded border border-danger-700 bg-danger-900/20 px-3 py-2 text-danger-200"
        role="alert"
      >
        {{ error }}
      </div>

      <div
        v-else-if="detail === undefined"
        class="rounded border border-surface-700 bg-surface-800 px-3 py-2 text-surface-300"
      >
        Stashed request details are not available.
      </div>

      <div v-else class="grid gap-4">
        <div
          class="grid gap-2 rounded border border-surface-700 bg-surface-800 p-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <div class="text-xs uppercase text-surface-500">History ID</div>
            <div class="mt-1 font-mono text-xs">{{ formatText(detail.httpHistoryId) }}</div>
          </div>
          <div>
            <div class="text-xs uppercase text-surface-500">Method</div>
            <div class="mt-1 font-mono text-xs">{{ formatText(detail.method).toUpperCase() }}</div>
          </div>
          <div>
            <div class="text-xs uppercase text-surface-500">Host</div>
            <div class="mt-1 truncate" :title="formatText(detail.host)">
              {{ formatText(detail.host) }}
            </div>
          </div>
          <div>
            <div class="text-xs uppercase text-surface-500">Stashed At</div>
            <div class="mt-1 font-mono text-xs">{{ formatStashedAt(detail.createdAt) }}</div>
          </div>
        </div>

        <div
          v-if="!detail.available"
          class="rounded border border-surface-700 bg-surface-800 px-3 py-2 text-surface-300"
        >
          This request is no longer available in Caido HTTP History.
        </div>

        <div v-else class="grid gap-4 lg:grid-cols-2">
          <section class="min-w-0 rounded border border-surface-700 bg-surface-800">
            <div class="border-b border-surface-700 px-3 py-2 font-semibold">Request</div>
            <div class="grid gap-3 p-3">
              <div>
                <div class="mb-1 text-xs uppercase text-surface-500">Raw</div>
                <pre
                  class="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded bg-surface-900 p-3 font-mono text-xs leading-5 text-surface-100"
                  >{{ formatText(detail.request?.rawRequest) }}</pre
                >
              </div>
              <div>
                <div class="mb-1 text-xs uppercase text-surface-500">Headers</div>
                <div
                  class="max-h-52 overflow-auto rounded bg-surface-900 p-3 font-mono text-xs leading-5"
                >
                  <div v-if="Object.keys(requestHeaders).length === 0" class="text-surface-500">
                    -
                  </div>
                  <template v-else>
                    <div v-for="(values, name) in requestHeaders" :key="name">
                      <span class="text-surface-400">{{ name }}:</span>
                      {{ formatHeaderValues(values) }}
                    </div>
                  </template>
                </div>
              </div>
              <div>
                <div class="mb-1 text-xs uppercase text-surface-500">Body</div>
                <pre
                  class="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-surface-900 p-3 font-mono text-xs leading-5 text-surface-100"
                  >{{ formatText(detail.request?.bodyText) }}</pre
                >
              </div>
            </div>
          </section>

          <section class="min-w-0 rounded border border-surface-700 bg-surface-800">
            <div class="border-b border-surface-700 px-3 py-2 font-semibold">Response</div>
            <div v-if="detail.response === undefined" class="p-3 text-surface-400">
              No response is available.
            </div>
            <div v-else class="grid gap-3 p-3">
              <div>
                <div class="mb-1 text-xs uppercase text-surface-500">Status</div>
                <div class="font-mono text-xs">{{ detail.response.statusCode ?? "-" }}</div>
              </div>
              <div>
                <div class="mb-1 text-xs uppercase text-surface-500">Headers</div>
                <div
                  class="max-h-52 overflow-auto rounded bg-surface-900 p-3 font-mono text-xs leading-5"
                >
                  <div v-if="Object.keys(responseHeaders).length === 0" class="text-surface-500">
                    -
                  </div>
                  <template v-else>
                    <div v-for="(values, name) in responseHeaders" :key="name">
                      <span class="text-surface-400">{{ name }}:</span>
                      {{ formatHeaderValues(values) }}
                    </div>
                  </template>
                </div>
              </div>
              <div>
                <div class="mb-1 text-xs uppercase text-surface-500">Body</div>
                <pre
                  class="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded bg-surface-900 p-3 font-mono text-xs leading-5 text-surface-100"
                  >{{ formatText(detail.response.bodyText) }}</pre
                >
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </Dialog>
</template>
