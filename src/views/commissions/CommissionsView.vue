<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { cancelCommission, fetchCommissions, payCommission } from '@/api/admin'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { Commission } from '@/types'
import { useToast } from '@/composables/useToast'
import { money } from '@/utils/format'
import { errorMessage, pageMeta } from '@/utils/http'

const items = ref<Commission[]>([])
const status = ref('')
const page = ref(1)
const lastPage = ref(1)
const total = ref(0)
const loading = ref(true)
const message = ref('')
const toast = useToast()

async function load(): Promise<void> {
  loading.value = true
  try {
    const payload = await fetchCommissions({
      status: status.value || undefined,
      page: page.value,
    })
    items.value = payload.data ?? []
    const meta = pageMeta(payload)
    lastPage.value = meta.lastPage
    total.value = meta.total
  } catch (error) {
    message.value = errorMessage(error, 'No se pudieron cargar las comisiones')
  } finally {
    loading.value = false
  }
}

async function pay(item: Commission): Promise<void> {
  try {
    await payCommission(item.id)
    await load()
    toast.success(`La comisión #${item.id} quedó pagada.`, 'Comisión pagada')
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo pagar la comisión')
    toast.fromError(error, 'No se pudo pagar la comisión')
  }
}

async function cancel(item: Commission): Promise<void> {
  if (!window.confirm('¿Cancelar esta comisión?')) {
    return
  }
  try {
    await cancelCommission(item.id)
    await load()
    toast.success(`La comisión #${item.id} se canceló.`, 'Comisión cancelada')
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo cancelar la comisión')
    toast.fromError(error, 'No se pudo cancelar la comisión')
  }
}

onMounted(load)
</script>

<template>
  <PageHeader eyebrow="Red" title="Comisiones" hint="Marca como pagadas las comisiones ya transferidas." />

  <div class="fi-card p-3 mb-3">
    <div class="row g-2">
      <div class="col-md-4">
        <select v-model="status" class="form-select" @change="page = 1; load()">
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="approved">Aprobada</option>
          <option value="paid">Pagada</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>
    </div>
  </div>

  <div v-if="message" class="alert alert-danger">{{ message }}</div>

  <div class="fi-card overflow-auto">
    <table class="table fi-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Líder</th>
          <th>Socio</th>
          <th>Monto</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="6" class="p-4 text-secondary">Cargando…</td></tr>
        <tr v-else-if="!items.length"><td colspan="6" class="p-4 text-secondary">Sin comisiones.</td></tr>
        <tr v-for="item in items" :key="item.id">
          <td>#{{ item.id }}</td>
          <td>{{ item.referrer?.name ?? '—' }}</td>
          <td>{{ item.referred?.name ?? '—' }}</td>
          <td>{{ money(item.amount) }}</td>
          <td><StatusBadge :value="item.status" /></td>
          <td class="text-end">
            <button
              v-if="item.status === 'pending' || item.status === 'approved'"
              class="btn btn-sm btn-accent me-2"
              @click="pay(item)"
            >
              Pagar
            </button>
            <button
              v-if="item.status !== 'paid' && item.status !== 'cancelled'"
              class="btn btn-sm btn-outline-danger"
              @click="cancel(item)"
            >
              Cancelar
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
