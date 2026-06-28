<script setup lang="ts">
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
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

function formatText(value: string | undefined) {
  return value !== undefined && value.length > 0 ? value : "-";
}
</script>

<template>
  <div class="grid gap-3">
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
      :tableProps="{ 'aria-label': 'Stashed HTTP history requests' }"
    >
      <template #empty>
        <div class="px-3 py-4 text-sm text-surface-400">No stashed requests found.</div>
      </template>

      <Column field="caidoRequestId" header="History ID" sortable>
        <template #body="{ data }">
          <span
            class="block max-w-[8rem] overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs"
            :title="formatText(data.caidoRequestId)"
          >
            {{ formatText(data.caidoRequestId) }}
          </span>
        </template>
      </Column>

      <Column field="method" header="Method" sortable>
        <template #body="{ data }">
          <code>{{ formatText(data.method) }}</code>
        </template>
      </Column>

      <Column field="host" header="Host" sortable>
        <template #body="{ data }">
          <span
            class="block max-w-[20rem] overflow-hidden text-ellipsis whitespace-nowrap"
            :title="formatText(data.host)"
          >
            {{ formatText(data.host) }}
          </span>
        </template>
      </Column>

      <Column field="path" header="Path" sortable>
        <template #body="{ data }">
          <span
            class="block max-w-[32rem] overflow-hidden text-ellipsis whitespace-nowrap"
            :title="formatPath(data.path)"
          >
            {{ formatPath(data.path) }}
          </span>
        </template>
      </Column>

      <Column field="createdAt" header="Stashed At" sortable>
        <template #body="{ data }">
          <span class="whitespace-nowrap">
            {{ formatStashedAt(data.createdAt) }}
          </span>
        </template>
      </Column>

      <Column header="Actions">
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
</template>
