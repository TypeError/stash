<script setup lang="ts">
import Button from "primevue/button";

defineProps<{
  count: number;
  loading: boolean;
}>();

defineEmits<{
  clear: [];
  refresh: [];
}>();
</script>

<template>
  <header class="mb-4 flex items-center justify-between gap-4">
    <div>
      <h1 class="m-0 text-xl font-semibold">Stash</h1>
      <p class="mt-1 mb-0 text-sm text-surface-400">
        Stash interesting HTTP History requests for later. {{ count }} request{{
          count === 1 ? "" : "s"
        }}
        stashed.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <Button
        type="button"
        label="Clear Stash"
        icon="fas fa-broom"
        size="small"
        severity="danger"
        :disabled="count === 0 || loading"
        @click="$emit('clear')"
      />

      <Button
        type="button"
        label="Refresh"
        icon="fas fa-list"
        size="small"
        severity="secondary"
        outlined
        :loading="loading"
        @click="$emit('refresh')"
      />
    </div>
  </header>
</template>
