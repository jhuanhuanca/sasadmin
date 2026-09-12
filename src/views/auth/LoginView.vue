<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { errorMessage, fieldErrors } from '@/utils/http'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const form = reactive({ email: '', password: '' })
const errors = ref<Record<string, string[]>>({})
const message = ref('')
const loading = ref(false)
const toast = useToast()

async function submit(): Promise<void> {
  loading.value = true
  message.value = ''
  errors.value = {}

  try {
    const status = await auth.login(form.email, form.password)
    if (status === 'setup') {
      await router.replace({ name: '2fa-setup' })
      return
    }
    if (status === 'challenge') {
      await router.replace({ name: '2fa-challenge' })
      return
    }
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (error) {
    errors.value = fieldErrors(error)
    message.value = error instanceof Error && error.message.includes('administración')
      ? error.message
      : errorMessage(error, 'No se pudo iniciar sesión')
    toast.error(message.value, 'No se pudo entrar')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center p-3" style="background: #111113">
    <div class="login-panel p-4 p-md-5">
      <div class="d-flex align-items-center gap-2 mb-4">
        <span class="rounded-3 bg-warning text-dark px-2 py-1 fw-bold">RX</span>
        <strong>REXmlm Admin</strong>
      </div>
      <h1 class="h3 mb-2">Entrar al panel</h1>
      <p class="text-secondary">Solo cuentas con rol administrador.</p>

      <div v-if="message" class="alert alert-danger">{{ message }}</div>

      <form class="d-grid gap-3" @submit.prevent="submit">
        <div>
          <label class="form-label">Correo</label>
          <input v-model="form.email" type="email" class="form-control" required autocomplete="username" />
          <div v-if="errors.email" class="form-text text-danger">{{ errors.email[0] }}</div>
        </div>
        <div>
          <label class="form-label">Contraseña</label>
          <input v-model="form.password" type="password" class="form-control" required autocomplete="current-password" />
        </div>
        <button class="btn btn-accent btn-lg" :disabled="loading">
          {{ loading ? 'Entrando…' : 'Iniciar sesión' }}
        </button>
      </form>
    </div>
  </div>
</template>
