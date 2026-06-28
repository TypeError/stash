<script setup lang="ts">
import Card from "primevue/card";
</script>

<template>
  <Card
    :pt="{
      body: { class: 'p-0' },
      content: { class: 'p-6' },
    }"
  >
    <template #content>
      <section class="text-surface-100">
        <i class="fas fa-suitcase mb-3 text-xl text-surface-500" aria-hidden="true" />
        <h2 class="m-0 text-base font-semibold">No requests stashed yet</h2>
        <p class="mt-2 mb-0 text-sm text-surface-400">
          Right-click a stashed request in HTTP History and choose Add to Stash.
        </p>
      </section>
    </template>
  </Card>
</template>
