<script setup lang="ts">
import { computed } from 'vue'
import { statusLabel } from '@/utils/format'

const props = defineProps<{
  value?: string | number | boolean | null
}>()

const tone = computed(() => {
  const value = String(props.value ?? '')
  if (['active', 'paid', 'approved', 'true'].includes(value)) return 'success'
  if (['pending', 'invited', 'requested', 'open', 'in_progress'].includes(value)) return 'warning'
  if (['suspended', 'cancelled', 'reversed', 'closed', 'rejected', 'false'].includes(value)) return 'danger'
  return 'secondary'
})

const label = computed(() => {
  if (props.value === true) return 'Activo'
  if (props.value === false) return 'Inactivo'
  return statusLabel(String(props.value ?? '—'))
})
</script>

<template>
  <span class="badge badge-soft" :class="`text-bg-${tone}`">{{ label }}</span>
</template>
