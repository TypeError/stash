<script setup lang="ts">
import Badge from "primevue/badge";
import Dialog from "primevue/dialog";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Tab from "primevue/tab";
import TabList from "primevue/tablist";
import TabPanel from "primevue/tabpanel";
import TabPanels from "primevue/tabpanels";
import Tabs from "primevue/tabs";
import Tag from "primevue/tag";
import { computed, ref, watch } from "vue";

import StashHttpTextBlock from "./StashHttpTextBlock.vue";
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

type HeaderValues = Parameters<typeof formatHeaderValues>[0];
type HeaderMap = Record<string, HeaderValues>;
type TagSeverity = "secondary" | "success" | "info" | "warn" | "danger";

const activeTab = ref("overview");

const displayMethod = computed(() => {
  return formatText(props.detail?.method).toUpperCase();
});

const displayPath = computed(() => {
  if (props.detail === undefined) {
    return "Stashed request details";
  }

  return formatPathWithQuery(props.detail.path, props.detail.url);
});

const displayHost = computed(() => {
  return formatText(props.detail?.host);
});

const displayUrl = computed(() => {
  return formatText(props.detail?.url);
});

const requestHeaders = computed<HeaderMap>(() => {
  return props.detail?.request?.headers ?? {};
});

const responseHeaders = computed<HeaderMap>(() => {
  return props.detail?.response?.headers ?? {};
});

const requestHeadersText = computed(() => {
  return formatHeaders(requestHeaders.value);
});

const responseHeadersText = computed(() => {
  return formatHeaders(responseHeaders.value);
});

const responseStatus = computed(() => {
  return props.detail?.response?.statusCode;
});

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      activeTab.value = "overview";
    }
  },
);

watch(
  () => props.detail?.id,
  () => {
    activeTab.value = "overview";
  },
);

function formatText(value: string | undefined) {
  return value !== undefined && value.length > 0 ? value : "-";
}

function formatHeaders(headers: HeaderMap) {
  const entries = Object.entries(headers);

  if (entries.length === 0) {
    return undefined;
  }

  return entries.map(([name, values]) => `${name}: ${formatHeaderValues(values)}`).join("\n");
}

function formatStatus(value: number | undefined) {
  return value === undefined ? "-" : String(value);
}

function getMethodSeverity(value: string | undefined): TagSeverity {
  const method = formatText(value).toUpperCase();

  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return "info";
  }

  if (method === "POST" || method === "PUT" || method === "PATCH") {
    return "warn";
  }

  if (method === "DELETE") {
    return "danger";
  }

  return "secondary";
}

function getStatusSeverity(value: number | undefined): TagSeverity {
  if (value === undefined) {
    return "secondary";
  }

  if (value >= 500) {
    return "danger";
  }

  if (value >= 400) {
    return "warn";
  }

  if (value >= 300) {
    return "info";
  }

  return "success";
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :draggable="false"
    :dismissableMask="true"
    :style="{ width: 'min(75rem, calc(100vw - 2rem))' }"
    :breakpoints="{ '960px': '92vw', '640px': '96vw' }"
    :pt="{
      header: {
        class: 'flex items-start gap-3 border-b border-surface-700/70 px-5 pt-5 pb-4',
      },
      headerActions: { class: 'ml-auto shrink-0' },
      closeButton: { class: 'shrink-0' },
      content: { class: 'p-0' },
    }"
    @update:visible="emit('update:visible', $event)"
  >
    <template #header>
      <div class="flex min-w-0 flex-1 items-start gap-3 pr-2">
        <span
          class="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-800 text-lg text-surface-300 ring-1 ring-surface-700 sm:flex"
          aria-hidden="true"
        >
          <span class="fas fa-box-open leading-none" />
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex min-w-0 items-center gap-2">
            <Tag
              v-if="detail !== undefined && detail.method !== undefined && detail.method.length > 0"
              :value="displayMethod"
              :severity="getMethodSeverity(detail.method)"
              rounded
              class="shrink-0 font-mono text-[0.7rem] leading-none"
            />

            <span
              class="min-w-0 truncate text-base font-semibold leading-6 text-surface-100"
              :title="displayPath"
            >
              {{ displayPath }}
            </span>
          </div>

          <div
            v-if="detail !== undefined"
            class="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-surface-400"
          >
            <span class="min-w-0 truncate" :title="displayHost">{{ displayHost }}</span>

            <span v-if="responseStatus !== undefined" class="flex items-center gap-1.5">
              <span class="text-surface-600" aria-hidden="true">•</span>
              <Tag
                :value="formatStatus(responseStatus)"
                :severity="getStatusSeverity(responseStatus)"
                rounded
                class="font-mono text-[0.65rem] leading-none"
              />
            </span>
          </div>
        </div>
      </div>
    </template>

    <div class="max-h-[78vh] overflow-auto px-5 pb-5 pt-4 text-sm text-surface-100">
      <div v-if="loading" class="grid gap-3">
        <Skeleton height="2.5rem" />
        <Skeleton height="10rem" />
        <Skeleton height="16rem" />
      </div>

      <Message v-else-if="error !== undefined" severity="error" :closable="false">
        {{ error }}
      </Message>

      <Message v-else-if="detail === undefined" severity="warn" :closable="false">
        Request details unavailable. This Stash entry still exists, but the original HTTP History
        request could not be loaded.
      </Message>

      <Tabs v-else v-model:value="activeTab" lazy class="stash-detail-tabs">
        <TabList>
          <Tab value="overview">
            <span class="flex items-center gap-2">
              <span class="fas fa-circle-info text-xs" aria-hidden="true" />
              <span>Overview</span>
            </span>
          </Tab>

          <Tab value="request">
            <span class="flex items-center gap-2">
              <span class="fas fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
              <span>Request</span>
            </span>
          </Tab>

          <Tab value="response">
            <span class="flex items-center gap-2">
              <span class="fas fa-arrow-down-left-from-square text-xs" aria-hidden="true" />
              <span>Response</span>
              <Badge
                v-if="responseStatus !== undefined"
                :value="formatStatus(responseStatus)"
                :severity="getStatusSeverity(responseStatus)"
                class="font-mono text-[0.65rem]"
              />
            </span>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="overview">
            <div class="grid gap-4">
              <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div class="rounded-md border border-surface-700 bg-surface-800 p-3">
                  <div class="text-xs uppercase tracking-wide text-surface-500">History ID</div>
                  <div class="mt-1 font-mono text-xs">{{ formatText(detail.httpHistoryId) }}</div>
                </div>

                <div class="rounded-md border border-surface-700 bg-surface-800 p-3">
                  <div class="text-xs uppercase tracking-wide text-surface-500">Method</div>
                  <div class="mt-2">
                    <Tag
                      v-if="detail.method !== undefined && detail.method.length > 0"
                      :value="displayMethod"
                      :severity="getMethodSeverity(detail.method)"
                      rounded
                      class="font-mono text-[0.7rem] leading-none"
                    />
                    <span v-else class="font-mono text-xs text-surface-500">-</span>
                  </div>
                </div>

                <div class="rounded-md border border-surface-700 bg-surface-800 p-3">
                  <div class="text-xs uppercase tracking-wide text-surface-500">Response</div>
                  <div class="mt-2">
                    <Tag
                      :value="formatStatus(responseStatus)"
                      :severity="getStatusSeverity(responseStatus)"
                      rounded
                      class="font-mono text-[0.7rem] leading-none"
                    />
                  </div>
                </div>

                <div class="min-w-0 rounded-md border border-surface-700 bg-surface-800 p-3">
                  <div class="text-xs uppercase tracking-wide text-surface-500">Host</div>
                  <div class="mt-1 truncate" :title="displayHost">{{ displayHost }}</div>
                </div>

                <div class="min-w-0 rounded-md border border-surface-700 bg-surface-800 p-3">
                  <div class="text-xs uppercase tracking-wide text-surface-500">Path</div>
                  <div class="mt-1 truncate font-mono text-xs" :title="displayPath">
                    {{ displayPath }}
                  </div>
                </div>

                <div class="rounded-md border border-surface-700 bg-surface-800 p-3">
                  <div class="text-xs uppercase tracking-wide text-surface-500">Stashed At</div>
                  <div class="mt-1 font-mono text-xs">{{ formatStashedAt(detail.createdAt) }}</div>
                </div>
              </div>

              <div
                v-if="detail.url !== undefined && detail.url.length > 0"
                class="min-w-0 rounded-md border border-surface-700 bg-surface-800 p-3"
              >
                <div class="text-xs uppercase tracking-wide text-surface-500">URL</div>
                <div class="mt-1 truncate font-mono text-xs" :title="displayUrl">
                  {{ displayUrl }}
                </div>
              </div>

              <Message v-if="!detail.available" severity="warn" :closable="false">
                The original HTTP History request could not be loaded. Metadata for this Stash entry
                is still available.
              </Message>
            </div>
          </TabPanel>

          <TabPanel value="request">
            <Message v-if="!detail.available" severity="warn" :closable="false">
              Request details unavailable. The original HTTP History request could not be loaded.
            </Message>

            <div v-else class="grid gap-4">
              <StashHttpTextBlock
                label="Raw"
                :value="detail.request?.rawRequest"
                maxHeightClass="max-h-96"
              />

              <StashHttpTextBlock
                label="Headers"
                :value="requestHeadersText"
                maxHeightClass="max-h-64"
              />

              <StashHttpTextBlock
                label="Body"
                :value="detail.request?.bodyText"
                maxHeightClass="max-h-80"
              />
            </div>
          </TabPanel>

          <TabPanel value="response">
            <Message v-if="!detail.available" severity="warn" :closable="false">
              Response details unavailable. The original HTTP History request could not be loaded.
            </Message>

            <Message v-else-if="detail.response === undefined" severity="info" :closable="false">
              No response is available.
            </Message>

            <div v-else class="grid gap-4">
              <div class="rounded-md border border-surface-700 bg-surface-800 p-3">
                <div class="mb-2 text-xs font-medium uppercase tracking-wide text-surface-500">
                  Status
                </div>
                <Tag
                  :value="formatStatus(detail.response.statusCode)"
                  :severity="getStatusSeverity(detail.response.statusCode)"
                  rounded
                  class="font-mono text-[0.7rem] leading-none"
                />
              </div>

              <StashHttpTextBlock
                label="Headers"
                :value="responseHeadersText"
                maxHeightClass="max-h-64"
              />

              <StashHttpTextBlock
                label="Body"
                :value="detail.response.bodyText"
                maxHeightClass="max-h-[28rem]"
              />
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </Dialog>
</template>

<style scoped>
.stash-detail-tabs :deep(.p-tablist) {
  background: transparent;
  border-color: var(--p-surface-700);
}

.stash-detail-tabs :deep(.p-tab) {
  padding: 0.75rem 1rem;
}

.stash-detail-tabs :deep(.p-tabpanels) {
  background: transparent;
  padding: 1rem 0 0;
}

.stash-detail-tabs :deep(.p-tabpanel) {
  padding: 0;
}

@media (max-width: 640px) {
  .stash-detail-tabs :deep(.p-tab) {
    padding: 0.75rem;
  }
}
</style>
