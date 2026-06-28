<script setup lang="ts">
import Button from "primevue/button";
import { defineEmits, defineProps } from "vue";

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
  <header class="flex items-center justify-between gap-4 mb-4">
    <div>
      <h1 class="m-0 text-xl font-semibold">Satchel</h1>
      <p class="mt-1 mb-0 text-sm text-surface-400">
        {{ count }} saved request{{ count === 1 ? "" : "s" }}
      </p>
    </div>

    <div class="flex items-center gap-2">
      <Button
        type="button"
        label="Clear All"
        icon="fas fa-trash"
        size="small"
        severity="danger"
        :disabled="count === 0 || loading"
        @click="$emit('clear')"
      />
      <Button
        type="button"
        label="Refresh"
        icon="fas fa-rotate"
        size="small"
        severity="secondary"
        :loading="loading"
        @click="$emit('refresh')"
      />
    </div>
  </header>
</template>
