<script setup lang="ts">
import Button from "primevue/button";
import { computed } from "vue";

import { isHttpHistoryId } from "./stash.httpHistory";
import type { StashItem } from "./stash.types";

const props = defineProps<{
  item: StashItem;
}>();

const emit = defineEmits<{
  details: [item: StashItem];
  view: [item: StashItem];
  replay: [item: StashItem];
  unstash: [item: StashItem];
}>();

const canOpenInHttpHistory = computed(() => {
  return isHttpHistoryId(props.item.httpHistoryId);
});

const historyIdLabel = computed(() => {
  return props.item.httpHistoryId !== undefined && props.item.httpHistoryId.length > 0
    ? props.item.httpHistoryId
    : "unknown";
});

const requestIdLabel = computed(() => {
  return props.item.requestId.length > 0 ? props.item.requestId : "unknown";
});
</script>

<template>
  <div class="flex justify-end gap-1">
    <Button
      type="button"
      icon="fas fa-eye"
      size="small"
      severity="secondary"
      text
      rounded
      :aria-label="`View request details ${requestIdLabel}`"
      :title="`View request details ${requestIdLabel}`"
      v-tooltip.top="'View details'"
      @click.stop="emit('details', item)"
    />

    <Button
      type="button"
      icon="fas fa-list"
      size="small"
      severity="secondary"
      text
      rounded
      :disabled="!canOpenInHttpHistory"
      :aria-label="`Open in HTTP History ${historyIdLabel}`"
      :title="`Open in HTTP History ${historyIdLabel}`"
      v-tooltip.top="'Open in HTTP History'"
      @click.stop="emit('view', item)"
    />

    <Button
      type="button"
      icon="fas fa-sync-alt"
      size="small"
      severity="secondary"
      text
      rounded
      :aria-label="`Send to Replay ${requestIdLabel}`"
      :title="`Send to Replay ${requestIdLabel}`"
      v-tooltip.top="'Send to Replay'"
      @click.stop="emit('replay', item)"
    />

    <Button
      type="button"
      icon="fas fa-box-open"
      size="small"
      severity="danger"
      text
      rounded
      :aria-label="`Unstash request ${requestIdLabel}`"
      :title="`Unstash request ${requestIdLabel}`"
      v-tooltip.top="'Unstash'"
      @click.stop="emit('unstash', item)"
    />
  </div>
</template>
