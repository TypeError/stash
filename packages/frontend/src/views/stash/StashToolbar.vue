<script setup lang="ts">
import Button from "primevue/button";
import InputText from "primevue/inputtext";

defineProps<{
  canShowStashed: boolean;
  count: number;
  loading: boolean;
  searchQuery: string;
}>();

defineEmits<{
  clear: [];
  refresh: [];
  showStashed: [];
  "update:searchQuery": [value: string];
}>();
</script>

<template>
  <header
    class="flex flex-col gap-3 border-b border-surface-700 pb-4 md:flex-row md:items-center md:justify-between"
  >
    <div class="min-w-0">
      <h1 class="m-0 text-xl font-semibold">Stash</h1>
      <p class="mt-1 mb-0 text-sm leading-5 text-surface-400">
        Stash interesting HTTP History requests for later review. {{ count }} request{{
          count === 1 ? "" : "s"
        }}
        stashed.
      </p>
    </div>

    <div class="flex flex-col gap-2 md:min-w-[28rem]">
      <div class="flex min-w-0 items-center gap-2">
        <span class="relative min-w-0 flex-1">
          <i
            class="fas fa-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-surface-500"
            aria-hidden="true"
          />
          <InputText
            :model-value="searchQuery"
            placeholder="Search ID, method, host, path, or URL"
            size="small"
            class="w-full pl-8"
            aria-label="Search stashed requests"
            @update:model-value="$emit('update:searchQuery', String($event))"
          />
        </span>

        <Button
          v-if="searchQuery.length > 0"
          type="button"
          icon="fas fa-times"
          size="small"
          severity="secondary"
          text
          rounded
          aria-label="Clear search"
          title="Clear search"
          v-tooltip.top="'Clear search'"
          @click="$emit('update:searchQuery', '')"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2 md:justify-end">
        <Button
          type="button"
          label="Show stashed in HTTP History"
          icon="fas fa-filter"
          size="small"
          :disabled="!canShowStashed || loading"
          @click="$emit('showStashed')"
        />

        <Button
          type="button"
          label="Refresh"
          icon="fas fa-sync-alt"
          size="small"
          severity="secondary"
          outlined
          :loading="loading"
          @click="$emit('refresh')"
        />

        <Button
          type="button"
          label="Clear Stash"
          icon="fas fa-broom"
          size="small"
          severity="danger"
          outlined
          :disabled="count === 0 || loading"
          @click="$emit('clear')"
        />
      </div>
    </div>
  </header>
</template>
