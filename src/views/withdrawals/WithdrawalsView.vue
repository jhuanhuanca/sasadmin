<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchWithdrawals, payWithdrawal, rejectWithdrawal } from '@/api/admin'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { WithdrawalRequest } from '@/types'
import { useToast } from '@/composables/useToast'
import { money } from '@/utils/format'
import { errorMessage, pageMeta } from '@/utils/http'

const items = ref<WithdrawalRequest[]>([])
const status = ref('requested')
const page = ref(1)
const lastPage = ref(1)
const total = ref(0)
const loading = ref(true)
const message = ref('')
const toast = useToast()

function digits(value: string | null | undefined): string {
  return String(value ?? '').replace(/\D/g, '')
}

function emailHref(item: WithdrawalRequest): string {
  const email = item.contact_email || item.user?.email || ''
  const subject = encodeURIComponent(`Retiro de comisiones #${item.id}`)
  const body = encodeURIComponent(
    `Hola ${item.user?.name ?? ''}, te escribimos de administración por tu solicitud de retiro de ${money(item.amount, item.currency)}.`,
  )
  return `mailto:${email}?subject=${subject}&body=${body}`
}

function whatsappHref(item: WithdrawalRequest): string | null {
  const phone = digits(item.whatsapp)
  if (!phone) {
    return null
  }

  const text = encodeURIComponent(
    `Hola ${item.user?.name ?? ''}, te contactamos de administración por tu solicitud de retiro #${item.id} por ${money(item.amount, item.currency)}.`,
  )
  return `https://wa.me/${phone}?text=${text}`
}

async function load(): Promise<void> {
  loading.value = true
  message.value = ''
  try {
    const payload = await fetchWithdrawals({
      status: status.value || undefined,
      page: page.value,
    })
    items.value = payload.data ?? []
    const meta = pageMeta(payload)
    lastPage.value = meta.lastPage
    total.value = meta.total
  } catch (error) {
    message.value = errorMessage(error, 'No se pudieron cargar los retiros')
  } finally {
    loading.value = false
  }
}

async function pay(item: WithdrawalRequest): Promise<void> {
  if (!window.confirm(`¿Confirmas que ya pagaste ${money(item.amount, item.currency)} a ${item.user?.name ?? 'este líder'}?`)) {
    return
  }

  try {
    await payWithdrawal(item.id)
    await load()
    toast.success(`El retiro #${item.id} quedó marcado como pagado.`, 'Retiro pagado')
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo marcar el retiro')
    toast.fromError(error, 'No se pudo marcar el retiro')
  }
}

async function reject(item: WithdrawalRequest): Promise<void> {
  if (!window.confirm(`¿Rechazar la solicitud #${item.id} de ${item.user?.name ?? 'este líder'}?`)) {
    return
  }

  const notes = window.prompt('Motivo del rechazo (opcional):') ?? ''
  try {
    await rejectWithdrawal(item.id, notes || undefined)
    await load()
    toast.success(`La solicitud #${item.id} fue rechazada.`, 'Retiro rechazado')
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo rechazar el retiro')
    toast.fromError(error, 'No se pudo rechazar el retiro')
  }
}

onMounted(load)
</script>

<template>
  <PageHeader
    eyebrow="Red"
    title="Retiros"
    hint="Solicitudes de cobro de líderes. Contáctalos por WhatsApp o correo y confirma el pago cuando la transferencia esté hecha."
  />

  <div class="fi-card p-3 mb-3">
    <div class="row g-2">
      <div class="col-md-4">
        <select v-model="status" class="form-select" @change="page = 1; load()">
          <option value="">Todos los estados</option>
          <option value="requested">Solicitada</option>
          <option value="paid">Pagada</option>
          <option value="rejected">Rechazada</option>
        </select>
      </div>
    </div>
  </div>

  <div v-if="message" class="alert alert-danger">{{ message }}</div>

  <div class="fi-card overflow-auto">
    <table class="table fi-table align-middle">
      <thead>
        <tr>
          <th>ID</th>
          <th>Líder</th>
          <th>Monto</th>
          <th>Contacto</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="6" class="p-4 text-secondary">Cargando…</td></tr>
        <tr v-else-if="!items.length"><td colspan="6" class="p-4 text-secondary">Sin solicitudes.</td></tr>
        <tr v-for="item in items" :key="item.id">
          <td>#{{ item.id }}</td>
          <td>
            <div class="fw-semibold">{{ item.user?.name ?? '—' }}</div>
            <div class="small text-secondary">{{ item.user?.email }}</div>
          </td>
          <td>{{ money(item.amount, item.currency) }}</td>
          <td>
            <div class="d-flex flex-wrap gap-1">
              <a
                v-if="item.contact_email || item.user?.email"
                class="btn btn-sm btn-outline-dark"
                :href="emailHref(item)"
              >
                Correo
              </a>
              <a
                v-if="whatsappHref(item)"
                class="btn btn-sm btn-outline-success"
                :href="whatsappHref(item) ?? undefined"
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
              <span v-if="!item.whatsapp && !(item.contact_email || item.user?.email)" class="text-secondary">—</span>
            </div>
            <div v-if="item.whatsapp" class="small text-secondary mt-1">{{ item.whatsapp }}</div>
          </td>
          <td><StatusBadge :value="item.status" /></td>
          <td class="text-end">
            <button
              v-if="item.status === 'requested'"
              class="btn btn-sm btn-accent me-2"
              @click="pay(item)"
            >
              Confirmar pago
            </button>
            <button
              v-if="item.status === 'requested'"
              class="btn btn-sm btn-outline-danger"
              @click="reject(item)"
            >
              Rechazar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="lastPage > 1" class="d-flex justify-content-between mt-3">
    <span class="small text-secondary">{{ total }} registros</span>
    <div class="btn-group">
      <button class="btn btn-sm btn-outline-secondary" :disabled="page <= 1" @click="page -= 1; load()">Anterior</button>
      <button class="btn btn-sm btn-outline-secondary" disabled>{{ page }} / {{ lastPage }}</button>
      <button class="btn btn-sm btn-outline-secondary" :disabled="page >= lastPage" @click="page += 1; load()">Siguiente</button>
    </div>
  </div>
</template>
