<script setup lang="ts">
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import { defineEmits, defineProps } from "vue";

import { formatPath, formatSavedAt } from "./satchel.format";
import type { SatchelItem } from "./satchel.types";

defineProps<{
  items: SatchelItem[];
  loading: boolean;
}>();

defineEmits<{
  view: [item: SatchelItem];
  delete: [item: SatchelItem];
}>();
</script>

<template>
  <DataTable
    class="satchel-table"
    data-key="id"
    size="small"
    :loading="loading"
    :value="items"
    striped-rows
  >
    <Column field="method" header="Method">
      <template #body="{ data }: { data: SatchelItem }">
        <code>{{ data.method !== undefined && data.method.length > 0 ? data.method : "-" }}</code>
      </template>
    </Column>

    <Column field="host" header="Host">
      <template #body="{ data }: { data: SatchelItem }">
        {{ data.host !== undefined && data.host.length > 0 ? data.host : "-" }}
      </template>
    </Column>

    <Column field="path" header="Path">
      <template #body="{ data }: { data: SatchelItem }">
        <span class="block max-w-[32rem] overflow-hidden text-ellipsis whitespace-nowrap">
          {{ formatPath(data.path) }}
        </span>
      </template>
    </Column>

    <Column field="createdAt" header="Saved">
      <template #body="{ data }: { data: SatchelItem }">
        {{ formatSavedAt(data.createdAt) }}
      </template>
    </Column>

    <Column header="Actions" body-class="text-right" header-class="text-right">
      <template #body="{ data }: { data: SatchelItem }">
        <div class="flex justify-end gap-2">
          <Button
            type="button"
            label="View"
            icon="fas fa-eye"
            size="small"
            severity="secondary"
            @click="$emit('view', data)"
          />
          <Button
            type="button"
            label="Delete"
            icon="fas fa-trash"
            size="small"
            severity="danger"
            @click="$emit('delete', data)"
          />
        </div>
      </template>
    </Column>

    <template #empty>
      <span>No Satchel items found.</span>
    </template>
  </DataTable>
</template>
