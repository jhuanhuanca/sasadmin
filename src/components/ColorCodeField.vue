<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  label: string
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const draft = ref(props.modelValue)

watch(
  () => props.modelValue,
  (value) => {
    draft.value = value
  },
)

function normalizeHex(value: string): string | null {
  let hex = value.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    hex = hex.split('').map((char) => char + char).join('')
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toLowerCase()}`
  }
  return null
}

function pickerValue(value: string): string {
  return normalizeHex(value) ?? '#000000'
}

function onPicker(event: Event): void {
  const target = event.target
  if (target instanceof HTMLInputElement) {
    emit('update:modelValue', target.value)
  }
}

function onCodeInput(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) {
    return
  }

  draft.value = target.value
  const next = normalizeHex(target.value)
  if (next) {
    emit('update:modelValue', next)
  }
}

function onCodeBlur(): void {
  const next = normalizeHex(draft.value)
  if (next) {
    emit('update:modelValue', next)
    draft.value = next
    return
  }

  draft.value = props.modelValue
}
</script>

<template>
  <label class="d-block">
    <span class="form-label">{{ label }}</span>
    <span class="d-flex align-items-center gap-2">
      <input
        :value="pickerValue(modelValue)"
        type="color"
        class="form-control form-control-color"
        :aria-label="label"
        @input="onPicker"
      />
      <input
        v-model="draft"
        type="text"
        maxlength="7"
        class="form-control text-uppercase"
        placeholder="#FFD452"
        spellcheck="false"
        :aria-label="`${label} hexadecimal`"
        @input="onCodeInput"
        @blur="onCodeBlur"
      />
    </span>
    <span class="form-text">Código hex, por ejemplo #FFD452</span>
  </label>
</template>
