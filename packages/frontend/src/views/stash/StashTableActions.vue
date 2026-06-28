<script setup lang="ts">
import Button from "primevue/button";
import { computed } from "vue";

import { isHttpHistoryRowId } from "./stash.httpHistory";
import type { StashItem } from "./stash.types";

const props = defineProps<{
  item: StashItem;
}>();

const emit = defineEmits<{
  view: [item: StashItem];
  replay: [item: StashItem];
  unstash: [item: StashItem];
}>();

const canOpenInHttpHistory = computed(() => {
  return isHttpHistoryRowId(props.item.caidoRequestId);
});

const historyIdLabel = computed(() => {
  return props.item.caidoRequestId !== undefined && props.item.caidoRequestId.length > 0
    ? props.item.caidoRequestId
    : "unknown";
});
</script>

<template>
  <div class="flex justify-end gap-2">
    <Button
      type="button"
      icon="fas fa-external-link-alt"
      size="small"
      severity="secondary"
      text
      rounded
      :disabled="!canOpenInHttpHistory"
      :aria-label="`View HTTP History row ${historyIdLabel}`"
      v-tooltip.top="'View in HTTP History'"
      @click.stop="emit('view', item)"
    />

    <Button
      type="button"
      icon="fas fa-refresh"
      size="small"
      severity="primary"
      text
      rounded
      :aria-label="`Send to Replay ${historyIdLabel}`"
      v-tooltip.top="'Send to Replay'"
      @click.stop="emit('replay', item)"
    />

    <Button
      type="button"
      icon="fas fa-times-circle"
      size="small"
      severity="danger"
      text
      rounded
      :aria-label="`Unstash HTTP History row ${historyIdLabel}`"
      v-tooltip.top="'Unstash'"
      @click.stop="emit('unstash', item)"
    />
  </div>
</template>
