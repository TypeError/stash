<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    emptyLabel?: string;
    label: string;
    maxHeightClass?: string;
    value: string | undefined;
  }>(),
  {
    emptyLabel: "-",
    maxHeightClass: "max-h-80",
  },
);

const isEmpty = computed(() => {
  return props.value === undefined || props.value.length === 0;
});

const displayValue = computed(() => {
  return isEmpty.value ? props.emptyLabel : props.value;
});

const lineCount = computed(() => {
  if (props.value === undefined || props.value.length === 0) {
    return 0;
  }

  return props.value.split("\n").length;
});

const lineCountLabel = computed(() => {
  if (lineCount.value === 0) {
    return "Empty";
  }

  return `${lineCount.value} line${lineCount.value === 1 ? "" : "s"}`;
});
</script>

<template>
  <section class="min-w-0 overflow-hidden rounded-md border border-surface-700 bg-surface-800">
    <div
      class="flex items-center justify-between gap-3 border-b border-surface-700 px-3 py-2 text-xs"
    >
      <div class="font-medium uppercase tracking-wide text-surface-400">
        {{ label }}
      </div>

      <div class="shrink-0 font-mono text-[0.7rem] text-surface-500">
        {{ lineCountLabel }}
      </div>
    </div>

    <pre
      :class="[
        'm-0 overflow-auto whitespace-pre-wrap break-words bg-surface-900 p-3 font-mono text-xs leading-5',
        maxHeightClass,
        isEmpty ? 'text-surface-500' : 'text-surface-100',
      ]"
      >{{ displayValue }}</pre
    >
  </section>
</template>
