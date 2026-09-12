import { useToastStore } from '@/stores/toast'
import { errorMessage } from '@/utils/http'

export function useToast() {
  const toast = useToastStore()

  return {
    success: (message: string, title?: string) => toast.success(message, title),
    error: (message: string, title?: string) => toast.error(message, title),
    info: (message: string, title?: string) => toast.info(message, title),
    fromError: (error: unknown, fallback?: string) => toast.error(errorMessage(error, fallback)),
  }
}
