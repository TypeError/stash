<script setup lang="ts">
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Tag from "primevue/tag";
import { computed } from "vue";

import StashTableActions from "./StashTableActions.vue";
import { formatPath, formatStashedAt } from "./stash.format";
import { isHttpHistoryRowId } from "./stash.httpHistory";
import type { StashItem } from "./stash.types.js";

const props = defineProps<{
  items: StashItem[];
  loading: boolean;
}>();

const emit = defineEmits<{
  view: [item: StashItem];
  showStashed: [];
  unstash: [item: StashItem];
}>();

const hasStashedRequestIds = computed(() => {
  return props.items.some((item) => isHttpHistoryRowId(item.caidoRequestId));
});

function hasText(value: string | undefined) {
  return value !== undefined && value.length > 0;
}

function formatText(value: string | undefined) {
  return hasText(value) ? value : "-";
}

function formatMethod(value: string | undefined) {
  return hasText(value) ? (value as string).toUpperCase() : "-";
}

type TagSeverity = "secondary" | "success" | "info" | "warn" | "danger" | "contrast";

function getMethodSeverity(value: string | undefined): TagSeverity {
  const method = formatMethod(value);

  if (method === "GET" || method === "HEAD") {
    return "success";
  }

  if (method === "POST") {
    return "info";
  }

  if (method === "PUT" || method === "PATCH") {
    return "warn";
  }

  if (method === "DELETE") {
    return "danger";
  }

  if (method === "OPTIONS") {
    return "contrast";
  }

  return "secondary";
}
</script>

<template>
  <div class="grid min-w-0 gap-3">
    <div class="flex justify-end">
      <Button
        type="button"
        label="Show stashed in HTTP History"
        icon="fas fa-filter"
        size="small"
        severity="secondary"
        :disabled="!hasStashedRequestIds"
        @click="emit('showStashed')"
      />
    </div>

    <div class="min-w-0 overflow-x-auto">
      <DataTable
        :value="props.items"
        dataKey="id"
        :loading="props.loading"
        paginator
        :rows="25"
        :rowsPerPageOptions="[10, 25, 50]"
        :alwaysShowPaginator="false"
        currentPageReportTemplate="{first}-{last} of {totalRecords}"
        paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
        sortField="createdAt"
        :sortOrder="-1"
        removableSort
        rowHover
        stripedRows
        size="small"
        class="stash-table"
        tableStyle="table-layout: fixed; min-width: 64rem; width: 100%;"
        :tableProps="{ 'aria-label': 'Stashed HTTP history requests' }"
      >
        <template #empty>
          <div class="px-3 py-4 text-sm text-surface-400">No stashed requests found.</div>
        </template>

        <Column field="caidoRequestId" header="History ID" sortable style="width: 7rem">
          <template #body="{ data }">
            <span
              class="block w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs"
              :title="formatText(data.caidoRequestId)"
            >
              {{ formatText(data.caidoRequestId) }}
            </span>
          </template>
        </Column>

        <Column field="method" header="Method" sortable style="width: 6rem">
          <template #body="{ data }">
            <Tag
              v-if="hasText(data.method)"
              :value="formatMethod(data.method)"
              :severity="getMethodSeverity(data.method)"
              rounded
              class="font-mono text-xs"
            />

            <span v-else class="text-surface-500">-</span>
          </template>
        </Column>

        <Column field="host" header="Host" sortable style="width: 20rem">
          <template #body="{ data }">
            <span
              class="block w-full overflow-hidden text-ellipsis whitespace-nowrap"
              :title="formatText(data.host)"
            >
              {{ formatText(data.host) }}
            </span>
          </template>
        </Column>

        <Column field="path" header="Path" sortable style="width: 18rem">
          <template #body="{ data }">
            <span
              class="block w-full overflow-hidden text-ellipsis whitespace-nowrap"
              :title="formatPath(data.path)"
            >
              {{ formatPath(data.path) }}
            </span>
          </template>
        </Column>

        <Column field="createdAt" header="Stashed At" sortable style="width: 13rem">
          <template #body="{ data }">
            <span
              class="block w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs"
              :title="formatStashedAt(data.createdAt)"
            >
              {{ formatStashedAt(data.createdAt) }}
            </span>
          </template>
        </Column>

        <Column header="Actions" style="width: 7rem">
          <template #body="{ data }">
            <StashTableActions
              :item="data"
              @view="emit('view', $event)"
              @unstash="emit('unstash', $event)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
