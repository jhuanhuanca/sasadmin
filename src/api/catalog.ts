import { api } from '@/api/client'
import type { Paginated } from '@/utils/http'

export function catalog<T>(path: string, options: Parameters<typeof api<T>>[1] = {}) {
  const clean = path.replace(/^\//, '')
  return api<T>(`/admin/catalog/${clean}`, options)
}

export function catalogList<T>(path: string, query: Record<string, string | number | undefined> = {}) {
  return catalog<Paginated<T> | { data: T[] }>(path, { query })
}
