export interface LaravelData<T> {
  data: T
}

export interface Paginated<T> {
  data: T[]
  current_page?: number
  last_page?: number
  total?: number
  per_page?: number
  meta?: {
    current_page: number
    last_page: number
    total: number
    per_page: number
  }
}

export function unwrapData<T>(payload: T | LaravelData<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = (payload as LaravelData<T>).data
    if (!Array.isArray(nested)) {
      return nested
    }
  }

  return payload as T
}

export function unwrapList<T>(payload: Paginated<T> | LaravelData<T[]> | T[]): T[] {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload && typeof payload === 'object' && Array.isArray((payload as Paginated<T>).data)) {
    return (payload as Paginated<T>).data
  }

  return []
}

export function pageMeta(payload: Paginated<unknown> | undefined): {
  page: number
  lastPage: number
  total: number
} {
  const meta = payload?.meta
  return {
    page: meta?.current_page ?? payload?.current_page ?? 1,
    lastPage: meta?.last_page ?? payload?.last_page ?? 1,
    total: meta?.total ?? payload?.total ?? unwrapList(payload as Paginated<unknown>).length,
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function fieldErrors(error: unknown): Record<string, string[]> {
  if (!isRecord(error)) {
    return {}
  }

  const data = isRecord(error.data) ? error.data : error

  if (isRecord(data.errors)) {
    return data.errors as Record<string, string[]>
  }

  return {}
}

export function errorMessage(error: unknown, fallback = 'No se pudo completar la acción'): string {
  if (!isRecord(error)) {
    return fallback
  }

  const data = isRecord(error.data) ? error.data : error

  if (typeof data.message === 'string' && data.message.length > 0) {
    return data.message
  }

  const first = Object.values(fieldErrors(error))[0]?.[0]
  return first ?? fallback
}
