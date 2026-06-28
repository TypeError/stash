<script setup lang="ts">
import Button from "primevue/button";
import { computed } from "vue";

import StashTableRow from "./StashTableRow.vue";
import type { StashItem } from "./stash.types.js";

const props = defineProps<{
  items: StashItem[];
  loading: boolean;
}>();

const emit = defineEmits<{
  open: [item: StashItem];
  showSaved: [];
  delete: [item: StashItem];
}>();

const hasSavedRequestIds = computed(() => {
  return props.items.some((item) => hasRequestId(item));
});

function hasRequestId(item: StashItem) {
  return item.caidoRequestId !== undefined && item.caidoRequestId.length > 0;
}
</script>

<template>
  <div class="grid gap-3">
    <div class="flex justify-end">
      <Button
        type="button"
        label="Show saved in HTTP History"
        icon="fas fa-filter"
        size="small"
        severity="secondary"
        :disabled="!hasSavedRequestIds"
        @click="emit('showSaved')"
      />
    </div>

    <div class="overflow-hidden rounded border border-surface-700">
      <table class="stash-table w-full border-collapse text-sm">
        <thead class="bg-surface-800 text-left text-surface-300">
          <tr>
            <th class="px-3 py-2 font-medium">ID</th>
            <th class="px-3 py-2 font-medium">Method</th>
            <th class="px-3 py-2 font-medium">Host</th>
            <th class="px-3 py-2 font-medium">Path</th>
            <th class="px-3 py-2 font-medium">Saved</th>
            <th class="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="props.loading">
            <td class="px-3 py-4 text-surface-400" colspan="6">Loading saved requests...</td>
          </tr>

          <tr v-else-if="props.items.length === 0">
            <td class="px-3 py-4 text-surface-400" colspan="6">No saved requests found.</td>
          </tr>

          <StashTableRow
            v-for="item in props.items"
            v-else
            :key="item.id"
            :item="item"
            @open="emit('open', $event)"
            @delete="emit('delete', $event)"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>
