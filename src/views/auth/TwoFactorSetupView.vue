<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import { confirmTwoFactor, setupTwoFactor } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { errorMessage, fieldErrors } from '@/utils/http'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()
const secret = ref('')
const qr = ref('')
const code = ref('')
const loading = ref(false)
const errors = ref<Record<string, string[]>>({})
const message = ref('')

onMounted(async () => {
  try {
    const payload = await setupTwoFactor()
    secret.value = payload.secret
    qr.value = await QRCode.toDataURL(payload.otpauth_url, { margin: 1, width: 220 })
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo iniciar la configuración de 2FA')
    toast.error(message.value)
  }
})

async function submit(): Promise<void> {
  loading.value = true
  errors.value = {}
  message.value = ''
  try {
    const payload = await confirmTwoFactor(code.value.replace(/\s/g, ''))
    auth.finishTwoFactor(payload)
    await router.replace({ name: 'dashboard' })
    toast.success('Verificación en dos pasos activada')
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
      <h1 class="h3 mb-2">Activar 2FA</h1>
      <p class="text-secondary">Los administradores deben usar una app (Google Authenticator, Authy, etc.).</p>
      <div v-if="message" class="alert alert-danger">{{ message }}</div>
      <div v-if="qr" class="text-center mb-3">
        <img :src="qr" alt="Código QR de autenticación" class="bg-white p-2 rounded" width="220" height="220" />
      </div>
      <p v-if="secret" class="small text-secondary text-break">Clave manual: <code>{{ secret }}</code></p>
      <form class="d-grid gap-3" @submit.prevent="submit">
        <div>
          <label class="form-label">Código de 6 dígitos</label>
          <input v-model="code" class="form-control" inputmode="numeric" autocomplete="one-time-code" required />
          <div v-if="errors.code" class="form-text text-danger">{{ errors.code[0] }}</div>
        </div>
        <button class="btn btn-accent btn-lg" :disabled="loading || !secret">
          {{ loading ? 'Confirmando…' : 'Confirmar y entrar' }}
        </button>
      </form>
    </div>
  </div>
</template>
