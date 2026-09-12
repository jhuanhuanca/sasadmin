<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { challengeTwoFactor } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { errorMessage, fieldErrors } from '@/utils/http'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()
const code = ref('')
const loading = ref(false)
const errors = ref<Record<string, string[]>>({})
const message = ref('')

async function submit(): Promise<void> {
  loading.value = true
  errors.value = {}
  message.value = ''
  try {
    const payload = await challengeTwoFactor(code.value.trim())
    auth.finishTwoFactor(payload)
    await router.replace({ name: 'dashboard' })
  } catch (error) {
    errors.value = fieldErrors(error)
    message.value = errorMessage(error, 'Código inválido')
    toast.error(message.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center p-3" style="background: #111113">
    <div class="login-panel p-4 p-md-5">
      <h1 class="h3 mb-2">Código de verificación</h1>
      <p class="text-secondary">Abre tu app de autenticación o usa un código de recuperación.</p>
      <div v-if="message" class="alert alert-danger">{{ message }}</div>
      <form class="d-grid gap-3" @submit.prevent="submit">
        <div>
          <label class="form-label">Código</label>
          <input v-model="code" class="form-control" autocomplete="one-time-code" required />
          <div v-if="errors.code" class="form-text text-danger">{{ errors.code[0] }}</div>
        </div>
        <button class="btn btn-accent btn-lg" :disabled="loading">
          {{ loading ? 'Verificando…' : 'Continuar' }}
        </button>
      </form>
    </div>
  </div>
</template>
