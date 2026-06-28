<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";
import Toolbar from "primevue/toolbar";
import { computed } from "vue";

const props = defineProps<{
  canShowStashed: boolean;
  count: number;
  loading: boolean;
  searchQuery: string;
}>();

const emit = defineEmits<{
  clear: [];
  refresh: [];
  showStashed: [];
  "update:searchQuery": [value: string];
}>();

const stashedRequestCount = computed(() => {
  if (props.count === 0) {
    return "No requests stashed yet.";
  }

  return `${props.count} request${props.count === 1 ? "" : "s"} stashed.`;
});

function updateSearchQuery(value: string | undefined) {
  emit("update:searchQuery", value ?? "");
}
</script>

<template>
  <Card class="mb-4 shrink-0 stash-header-card">
    <template #content>
      <header class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div class="group flex min-w-0 items-start gap-3">
          <span
            class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-800 text-2xl text-surface-200 ring-1 ring-surface-700 transition-colors group-hover:bg-surface-700 group-hover:text-surface-100"
            aria-hidden="true"
          >
            <span
              class="fas fa-box absolute leading-none transition-all duration-150 group-hover:scale-90 group-hover:opacity-0"
            />

            <span
              class="fas fa-box-open absolute leading-none opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:opacity-100"
            />
          </span>

          <div class="min-w-0">
            <h1 class="m-0 text-2xl font-black leading-none tracking-[0.16em]">STASH</h1>

            <p class="mt-2 mb-0 max-w-2xl text-sm leading-5 text-surface-400">
              Keep interesting HTTP History requests easy to find and reopen later.
              {{ stashedRequestCount }}
            </p>
          </div>
        </div>

        <Toolbar
          aria-label="Stash request controls"
          class="stash-control-toolbar xl:min-w-[38rem]"
          :pt="{
            start: { class: 'min-w-0 flex-1' },
            end: { class: 'min-w-0' },
          }"
        >
          <template #start>
            <div class="flex w-full min-w-0 items-center gap-2">
              <IconField class="min-w-0 flex-1">
                <InputIcon class="fas fa-search" />

                <InputText
                  :model-value="searchQuery"
                  placeholder="Search"
                  size="small"
                  class="w-full"
                  aria-label="Search stashed requests"
                  @update:model-value="updateSearchQuery"
                />
              </IconField>

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
                @click="emit('update:searchQuery', '')"
              />
            </div>
          </template>

          <template #end>
            <div class="flex flex-wrap items-center gap-2 xl:justify-end">
              <Button
                type="button"
                label="Filter HTTP History"
                icon="fas fa-filter"
                size="small"
                severity="warn"
                outlined
                :disabled="!canShowStashed || loading"
                @click="emit('showStashed')"
              />

              <Button
                type="button"
                label="Refresh"
                icon="fas fa-rotate-right"
                size="small"
                severity="secondary"
                text
                :loading="loading"
                @click="emit('refresh')"
              />

              <Button
                type="button"
                label="Clear Stash"
                icon="fas fa-broom"
                size="small"
                severity="danger"
                text
                :disabled="count === 0 || loading"
                @click="emit('clear')"
              />
            </div>
          </template>
        </Toolbar>
      </header>
    </template>
  </Card>
</template>

<style scoped>
.stash-control-toolbar {
  border: 0;
  background: transparent;
  padding: 0;
}

.stash-control-toolbar :deep(.p-toolbar-start) {
  min-width: 0;
}

.stash-control-toolbar :deep(.p-toolbar-end) {
  min-width: 0;
}

@media (max-width: 1279px) {
  .stash-control-toolbar {
    align-items: stretch;
    gap: 0.5rem;
  }

  .stash-control-toolbar :deep(.p-toolbar-start),
  .stash-control-toolbar :deep(.p-toolbar-end) {
    width: 100%;
  }
}
</style>
