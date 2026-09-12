import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authApi from '@/api/auth'
import { getStoredToken, setStoredToken } from '@/api/client'
import type { AuthPayload, AuthUser } from '@/types'
import { roleNames } from '@/utils/format'
import { unwrapData } from '@/utils/http'

const PENDING_KEY = 'rexmlm.admin.2fa'

type TwoFactorStatus = 'setup' | 'challenge'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(getStoredToken())
  const booted = ref(false)
  const pendingTwoFactor = ref<TwoFactorStatus | null>(readPending())
  const recoveryCodes = ref<string[]>([])

  const isAuthenticated = computed(() => Boolean(user.value && token.value && !pendingTwoFactor.value))
  const isAdmin = computed(() => roleNames(user.value).includes('admin'))

  function readPending(): TwoFactorStatus | null {
    const value = sessionStorage.getItem(PENDING_KEY)
    return value === 'setup' || value === 'challenge' ? value : null
  }

  function persist(nextUser: AuthUser, nextToken: string): void {
    user.value = unwrapData(nextUser)
    token.value = nextToken
    pendingTwoFactor.value = null
    sessionStorage.removeItem(PENDING_KEY)
    setStoredToken(nextToken)
  }

  function keepPending(nextToken: string, status: TwoFactorStatus): void {
    token.value = nextToken
    pendingTwoFactor.value = status
    sessionStorage.setItem(PENDING_KEY, status)
    setStoredToken(nextToken)
  }

  function clear(): void {
    user.value = null
    token.value = null
    pendingTwoFactor.value = null
    recoveryCodes.value = []
    sessionStorage.removeItem(PENDING_KEY)
    setStoredToken(null)
  }

  async function login(email: string, password: string): Promise<TwoFactorStatus | 'ok'> {
    const payload = await authApi.login(email, password)

    if (payload.two_factor_status === 'setup' || payload.two_factor_status === 'challenge') {
      keepPending(payload.token, payload.two_factor_status)
      return payload.two_factor_status
    }

    persist(payload.user, payload.token)

    if (!roleNames(payload.user).includes('admin')) {
      clear()
      throw new Error('Esta cuenta no tiene acceso al panel de administración.')
    }

    return 'ok'
  }

  function finishTwoFactor(payload: AuthPayload): void {
    recoveryCodes.value = payload.recovery_codes ?? []
    persist(payload.user, payload.token)
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout()
    } finally {
      clear()
    }
  }

  async function hydrate(): Promise<void> {
    if (!token.value) {
      booted.value = true
      return
    }

    if (pendingTwoFactor.value) {
      booted.value = true
      return
    }

    try {
      user.value = await authApi.fetchMe()
      if (!roleNames(user.value).includes('admin')) {
        clear()
      }
    } catch {
      clear()
    } finally {
      booted.value = true
    }
  }

  function dismissRecoveryCodes(): void {
    recoveryCodes.value = []
  }

  return {
    user,
    token,
    booted,
    pendingTwoFactor,
    recoveryCodes,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    hydrate,
    clear,
    finishTwoFactor,
    dismissRecoveryCodes,
  }
})
