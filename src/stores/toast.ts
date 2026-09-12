import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type ToastKind = 'success' | 'error' | 'info'

export type ToastItem = {
  id: number
  kind: ToastKind
  title: string
  message: string
}

let nextId = 1

export const useToastStore = defineStore('toast', () => {
  const items = ref<ToastItem[]>([])
  const list = computed(() => items.value)

  function dismiss(id: number): void {
    items.value = items.value.filter((item) => item.id !== id)
  }

  function push(kind: ToastKind, message: string, title?: string, ttl = 4200): number {
    const id = nextId++
    const labels: Record<ToastKind, string> = {
      success: 'Listo',
      error: 'No se pudo completar',
      info: 'Aviso',
    }
    items.value = [...items.value.slice(-4), { id, kind, title: title || labels[kind], message }]
    if (ttl > 0) {
      window.setTimeout(() => dismiss(id), ttl)
    }
    return id
  }

  function success(message: string, title = 'Listo'): number {
    return push('success', message, title)
  }

  function error(message: string, title = 'Algo salió mal'): number {
    return push('error', message, title, 6200)
  }

  function info(message: string, title = 'Aviso'): number {
    return push('info', message, title)
  }

  return { list, push, success, error, info, dismiss }
})
