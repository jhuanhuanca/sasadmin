<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()

function icon(kind: string): string {
  if (kind === 'success') {
    return 'bi-check-circle-fill'
  }
  if (kind === 'error') {
    return 'bi-exclamation-circle-fill'
  }
  return 'bi-info-circle-fill'
}
</script>

<template>
  <div class="toast-stack">
    <article
      v-for="item in toast.list"
      :key="item.id"
      class="toast-card"
      :class="`is-${item.kind}`"
      role="status"
    >
      <i :class="icon(item.kind)" />
      <div class="min-w-0 flex-grow-1">
        <strong>{{ item.title }}</strong>
        <p class="mb-0">{{ item.message }}</p>
      </div>
      <button type="button" class="btn-close" aria-label="Cerrar aviso" @click="toast.dismiss(item.id)" />
    </article>
  </div>
</template>
