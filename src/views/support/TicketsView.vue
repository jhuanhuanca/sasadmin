<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  fetchSupportTicket,
  fetchSupportTickets,
  replySupportTicket,
  updateSupportTicket,
} from '@/api/admin'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { SupportTicket } from '@/types'
import { useToast } from '@/composables/useToast'
import { errorMessage, pageMeta, unwrapData } from '@/utils/http'

const items = ref<SupportTicket[]>([])
const selected = ref<SupportTicket | null>(null)
const status = ref('')
const source = ref('')
const page = ref(1)
const lastPage = ref(1)
const total = ref(0)
const loading = ref(true)
const saving = ref(false)
const reply = ref('')
const message = ref('')
const toast = useToast()

const sourceLabel: Record<string, string> = {
  landing: 'Web pública',
  platform: 'Plataforma',
}

const canReply = computed(() => selected.value && selected.value.status !== 'closed')

async function load(): Promise<void> {
  loading.value = true
  message.value = ''
  try {
    const payload = await fetchSupportTickets({
      status: status.value || undefined,
      source: source.value || undefined,
      page: page.value,
    })
    items.value = payload.data ?? []
    const meta = pageMeta(payload)
    lastPage.value = meta.lastPage
    total.value = meta.total
  } catch (error) {
    message.value = errorMessage(error, 'No se pudieron cargar los tickets')
  } finally {
    loading.value = false
  }
}

async function openTicket(ticket: SupportTicket): Promise<void> {
  try {
    selected.value = unwrapData(await fetchSupportTicket(ticket.id))
    reply.value = ''
  } catch (error) {
    toast.fromError(error, 'No se pudo abrir el ticket')
  }
}

async function changeStatus(next: SupportTicket['status']): Promise<void> {
  if (!selected.value) {
    return
  }
  saving.value = true
  try {
    selected.value = unwrapData(await updateSupportTicket(selected.value.id, next))
    toast.success('El estado del ticket quedó actualizado.', 'Estado actualizado')
    await load()
  } catch (error) {
    toast.fromError(error, 'No se pudo cambiar el estado')
  } finally {
    saving.value = false
  }
}

async function sendReply(): Promise<void> {
  if (!selected.value || !reply.value.trim()) {
    return
  }
  saving.value = true
  try {
    selected.value = unwrapData(await replySupportTicket(selected.value.id, reply.value.trim()))
    reply.value = ''
    toast.success('La respuesta quedó en el ticket.', 'Respuesta enviada')
    await load()
  } catch (error) {
    toast.fromError(error, 'No se pudo enviar la respuesta')
  } finally {
    saving.value = false
  }
}

watch([status, source], () => {
  page.value = 1
  void load()
})

onMounted(load)
</script>

<template>
  <div>
  <PageHeader
    eyebrow="Soporte"
    title="Tickets"
    hint="Consultas de la web pública y tickets que envían los líderes desde REXMLM."
  >
    <select v-model="source" class="form-select" style="width: auto">
      <option value="">Todos los orígenes</option>
      <option value="landing">Web pública</option>
      <option value="platform">Plataforma</option>
    </select>
    <select v-model="status" class="form-select" style="width: auto">
      <option value="">Todos los estados</option>
      <option value="open">Abiertos</option>
      <option value="in_progress">En atención</option>
      <option value="closed">Cerrados</option>
    </select>
  </PageHeader>

  <div v-if="message" class="alert alert-danger">{{ message }}</div>

  <div class="row g-4">
    <div class="col-lg-6">
      <div class="fi-card overflow-auto">
        <table class="table fi-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Contacto</th>
              <th>Origen</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="4" class="p-4 text-secondary">Cargando…</td></tr>
            <tr v-else-if="!items.length"><td colspan="4" class="p-4 text-secondary">Sin tickets.</td></tr>
            <tr
              v-for="ticket in items"
              :key="ticket.id"
              role="button"
              :class="{ 'table-active': selected?.id === ticket.id }"
              @click="openTicket(ticket)"
            >
              <td>{{ ticket.id }}</td>
              <td>
                <div class="fw-semibold">{{ ticket.subject }}</div>
                <div class="small text-secondary">{{ ticket.name }} · {{ ticket.email }}</div>
              </td>
              <td>{{ sourceLabel[ticket.source] ?? ticket.source }}</td>
              <td><StatusBadge :value="ticket.status" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="lastPage > 1" class="d-flex justify-content-between align-items-center mt-3">
        <span class="small text-secondary">{{ total }} tickets</span>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-secondary" :disabled="page <= 1" @click="page -= 1; load()">Anterior</button>
          <button class="btn btn-sm btn-outline-secondary" :disabled="page >= lastPage" @click="page += 1; load()">Siguiente</button>
        </div>
      </div>
    </div>

    <div class="col-lg-6">
      <div v-if="!selected" class="fi-card p-4 text-secondary">Elige un ticket para verlo y responder.</div>
      <div v-else class="fi-card p-4">
        <div class="d-flex justify-content-between gap-3">
          <div>
            <p class="small text-secondary mb-1">Ticket #{{ selected.id }} · {{ sourceLabel[selected.source] }}</p>
            <h3 class="h5 mb-1">{{ selected.subject }}</h3>
            <p class="mb-0">{{ selected.name }} · <a :href="`mailto:${selected.email}`">{{ selected.email }}</a></p>
          </div>
          <StatusBadge :value="selected.status" />
        </div>
        <p class="mt-3 mb-0 whitespace-pre-wrap" style="white-space: pre-wrap">{{ selected.message }}</p>

        <div v-if="selected.replies?.length" class="mt-4 d-grid gap-2">
          <div v-for="item in selected.replies" :key="item.id" class="rounded-3 bg-light p-3">
            <div class="small text-secondary">
              {{ item.author_role === 'admin' ? 'Administración' : item.author_name }}
            </div>
            <div style="white-space: pre-wrap">{{ item.message }}</div>
          </div>
        </div>

        <div class="d-flex flex-wrap gap-2 mt-4">
          <button class="btn btn-sm btn-outline-dark" :disabled="saving" @click="changeStatus('in_progress')">En atención</button>
          <button class="btn btn-sm btn-outline-dark" :disabled="saving" @click="changeStatus('closed')">Cerrar</button>
          <button class="btn btn-sm btn-outline-secondary" :disabled="saving" @click="changeStatus('open')">Reabrir</button>
        </div>

        <form v-if="canReply" class="mt-4 d-grid gap-2" @submit.prevent="sendReply">
          <label class="form-label mb-0">Responder</label>
          <textarea v-model="reply" class="form-control" rows="4" required />
          <button class="btn btn-accent" :disabled="saving">{{ saving ? 'Enviando…' : 'Enviar respuesta' }}</button>
        </form>
      </div>
    </div>
  </div>
  </div>
</template>
