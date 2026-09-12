import { FetchError, ofetch } from 'ofetch'

const TOKEN_KEY = 'rexmlm.admin.token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    return
  }

  localStorage.removeItem(TOKEN_KEY)
}

const apiBase = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
  : ''

export const api = ofetch.create({
  baseURL: apiBase ? `${apiBase}/api/v1` : '/api/v1',
  credentials: apiBase ? 'omit' : 'same-origin',
  headers: {
    Accept: 'application/json',
  },
  onRequest({ options }) {
    const headers = new Headers(options.headers as HeadersInit | undefined)
    const token = getStoredToken()

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    headers.set('Accept', 'application/json')
    options.headers = headers
  },
  onResponseError({ response }) {
    if (response.status !== 401) {
      return
    }

    if (response.url.includes('/auth/login') || response.url.includes('/auth/two-factor')) {
      return
    }

    setStoredToken(null)

    if (!window.location.pathname.startsWith('/login')) {
      window.location.assign('/login')
    }
  },
})

export { FetchError }
