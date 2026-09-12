<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  hint?: string
}>()
</script>

<template>
  <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
    <div>
      <p v-if="eyebrow" class="text-uppercase small text-secondary mb-1" style="letter-spacing: 0.14em">{{ eyebrow }}</p>
      <h2 class="h3 mb-1">{{ title }}</h2>
      <p v-if="hint" class="text-secondary mb-0">{{ hint }}</p>
    </div>
    <div class="d-flex flex-wrap gap-2">
      <slot />
    </div>
  </div>
</template>
