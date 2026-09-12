/// <reference types="vite/client" />

export {}

declare module 'vue-router' {
  interface RouteMeta {
    guestOnly?: boolean
    requiresAuth?: boolean
    twoFactor?: 'setup' | 'challenge'
    role?: string
    title?: string
    resource?: string
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
