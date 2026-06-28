<script setup lang="ts">
import Button from "primevue/button";
import { computed } from "vue";

import { formatPath, formatStashedAt } from "./stash.format";
import type { StashItem } from "./stash.types";

const props = defineProps<{
  item: StashItem;
}>();

const emit = defineEmits<{
  open: [item: StashItem];
  delete: [item: StashItem];
}>();

const canOpenInHttpHistory = computed(() => {
  return props.item.caidoRequestId !== undefined && props.item.caidoRequestId.length > 0;
});
</script>

<template>
  <tr class="border-t border-surface-700 odd:bg-surface-900 even:bg-surface-800/40">
    <td class="px-3 py-2 align-middle">
      <span class="block max-w-[32rem] overflow-hidden text-ellipsis whitespace-nowrap">
        {{ item.caidoRequestId }}
      </span>
    </td>

    <td class="px-3 py-2 align-middle">
      <code>
        {{ item.method !== undefined && item.method.length > 0 ? item.method : "-" }}
      </code>
    </td>

    <td class="px-3 py-2 align-middle">
      {{ item.host !== undefined && item.host.length > 0 ? item.host : "-" }}
    </td>

    <td class="px-3 py-2 align-middle">
      <span class="block max-w-[32rem] overflow-hidden text-ellipsis whitespace-nowrap">
        {{ formatPath(item.path) }}
      </span>
    </td>

    <td class="px-3 py-2 align-middle">
      {{ formatStashedAt(item.createdAt) }}
    </td>

    <td class="px-3 py-2 align-middle">
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          label="Open"
          icon="fas fa-arrow-up-right-from-square"
          size="small"
          severity="secondary"
          :disabled="!canOpenInHttpHistory"
          @click.stop="emit('open', item)"
        />

        <Button
          type="button"
          label="Delete"
          icon="fas fa-trash"
          size="small"
          severity="danger"
          @click.stop="emit('delete', item)"
        />
      </div>
    </td>
  </tr>
</template>
