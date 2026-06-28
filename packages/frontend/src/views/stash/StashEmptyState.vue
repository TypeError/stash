<script setup lang="ts">
withDefaults(
  defineProps<{
    compact?: boolean;
    description?: string;
    title?: string;
  }>(),
  {
    compact: false,
    description: "Use the context menu or command palette to stash requests from HTTP History.",
    title: "No stashed requests yet",
  },
);
</script>

<template>
  <section
    :class="[
      'flex flex-col items-center justify-center rounded-lg border border-surface-700 bg-surface-800/60 text-center text-sm text-surface-100 ring-1 ring-surface-900/30',
      compact ? 'px-4 py-8' : 'px-6 py-14',
    ]"
  >
    <span
      class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-900 text-2xl text-surface-500 ring-1 ring-surface-700"
      aria-hidden="true"
    >
      <span class="fas fa-box-open leading-none" />
    </span>

    <h2 class="m-0 text-base font-semibold">{{ title }}</h2>
    <p class="mt-2 mb-0 max-w-md leading-5 text-surface-400">
      {{ description }}
    </p>
  </section>
</template>
