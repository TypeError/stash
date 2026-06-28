<script setup lang="ts">
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Tag from "primevue/tag";

import StashEmptyState from "./StashEmptyState.vue";
import StashTableActions from "./StashTableActions.vue";
import { formatPathWithQuery, formatStashedAt } from "./stash.format";
import type { StashItem } from "./stash.types.js";

const props = defineProps<{
  emptyDescription?: string;
  emptyMessage: string;
  items: StashItem[];
  loading: boolean;
}>();

const emit = defineEmits<{
  details: [item: StashItem];
  view: [item: StashItem];
  replay: [item: StashItem];
  unstash: [item: StashItem];
}>();

type TagSeverity = "secondary" | "success" | "info" | "warn" | "danger";

function hasText(value: string | undefined) {
  return value !== undefined && value.length > 0;
}

function formatText(value: string | undefined) {
  return hasText(value) ? value : "-";
}

function formatMethod(value: string | undefined) {
  return hasText(value) ? value.toUpperCase() : "-";
}

function getMethodSeverity(value: string | undefined): TagSeverity {
  const method = formatMethod(value);

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
</script>

<template>
  <div class="h-full min-h-0 min-w-0">
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
      resizableColumns
      columnResizeMode="fit"
      rowHover
      scrollable
      scrollHeight="flex"
      stripedRows
      size="small"
      class="stash-table h-full"
      tableStyle="table-layout: fixed; min-width: 58rem; width: 100%;"
      :tableProps="{ 'aria-label': 'Stashed HTTP History requests' }"
    >
      <template #empty>
        <div class="p-4">
          <StashEmptyState
            compact
            :description="props.emptyDescription"
            :title="props.emptyMessage"
          />
        </div>
      </template>

      <Column field="httpHistoryId" header="History ID" sortable style="width: 6.5rem">
        <template #body="{ data }">
          <span
            class="block w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs"
            :title="formatText(data.httpHistoryId)"
          >
            {{ formatText(data.httpHistoryId) }}
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
            class="font-mono text-[0.7rem] leading-none"
          />

          <span v-else class="text-surface-500">-</span>
        </template>
      </Column>

      <Column field="host" header="Host" sortable style="width: 17rem">
        <template #body="{ data }">
          <span
            class="block w-full overflow-hidden text-ellipsis whitespace-nowrap"
            :title="formatText(data.host)"
          >
            {{ formatText(data.host) }}
          </span>
        </template>
      </Column>

      <Column field="path" header="Path" sortable style="width: 20rem">
        <template #body="{ data }">
          <span
            class="block w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-surface-200"
            :title="formatPathWithQuery(data.path, data.url)"
          >
            {{ formatPathWithQuery(data.path, data.url) }}
          </span>
        </template>
      </Column>

      <Column field="createdAt" header="Stashed At" sortable style="width: 12rem">
        <template #body="{ data }">
          <span
            class="block w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs"
            :title="formatStashedAt(data.createdAt)"
          >
            {{ formatStashedAt(data.createdAt) }}
          </span>
        </template>
      </Column>

      <Column header="Actions" style="width: 9.5rem" bodyClass="text-right">
        <template #body="{ data }">
          <StashTableActions
            :item="data"
            @details="emit('details', $event)"
            @view="emit('view', $event)"
            @replay="emit('replay', $event)"
            @unstash="emit('unstash', $event)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.stash-table :deep(.p-datatable-column-sorted) {
  background: transparent;
  color: inherit;
}

.stash-table :deep(.p-sortable-column-icon) {
  opacity: 0.65;
}

.stash-table :deep(.p-datatable-tbody > tr > td),
.stash-table :deep(.p-datatable-thead > tr > th) {
  overflow: hidden;
}

.stash-table :deep(.p-datatable-tbody > tr > td) {
  vertical-align: middle;
}
</style>
