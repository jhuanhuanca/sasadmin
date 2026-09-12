import type { AuthPayload, AuthUser } from '@/types'
import type { LaravelData } from '@/utils/http'
import { api } from '@/api/client'
import { unwrapData } from '@/utils/http'

export async function login(email: string, password: string): Promise<AuthPayload> {
  return api<AuthPayload>('/auth/login', { method: 'POST', body: { email, password } })
}

export async function setupTwoFactor(): Promise<{ secret: string; otpauth_url: string }> {
  return api('/auth/two-factor/setup', { method: 'POST' })
}

export async function confirmTwoFactor(code: string): Promise<AuthPayload> {
  return api<AuthPayload>('/auth/two-factor/confirm', { method: 'POST', body: { code } })
}

export async function challengeTwoFactor(code: string): Promise<AuthPayload> {
  return api<AuthPayload>('/auth/two-factor/challenge', { method: 'POST', body: { code } })
}

export async function logout(): Promise<void> {
  await api('/auth/logout', { method: 'POST' })
}

export async function fetchMe(): Promise<AuthUser> {
  const payload = await api<AuthUser | LaravelData<AuthUser>>('/auth/me')
  return unwrapData(payload)
}
