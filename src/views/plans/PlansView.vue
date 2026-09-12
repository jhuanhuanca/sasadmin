<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { createPlan, deletePlan, fetchPlans, updatePlan } from '@/api/admin'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { Plan } from '@/types'
import { useToast } from '@/composables/useToast'
import { money } from '@/utils/format'
import { errorMessage, fieldErrors } from '@/utils/http'

const plans = ref<Plan[]>([])
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const errors = ref<Record<string, string[]>>({})
const editing = ref<Plan | null>(null)
const open = ref(false)
const toast = useToast()
const form = reactive({
  name: '',
  price: 0,
  currency: 'USD',
  interval: 'month',
  commission_percentage: 10,
  is_active: true,
  paddle_price_id: '',
})

async function load(): Promise<void> {
  loading.value = true
  try {
    plans.value = await fetchPlans()
  } catch (error) {
    message.value = errorMessage(error, 'No se pudieron cargar los planes')
  } finally {
    loading.value = false
  }
}

function start(plan?: Plan): void {
  editing.value = plan ?? null
  form.name = plan?.name ?? ''
  form.price = Number(plan?.price ?? 0)
  form.currency = plan?.currency ?? 'USD'
  form.interval = plan?.interval ?? 'month'
  form.commission_percentage = Number(plan?.commission_percentage ?? 10)
  form.is_active = plan?.is_active ?? true
  form.paddle_price_id = plan?.paddle_price_id ?? plan?.stripe_price_id ?? ''
  errors.value = {}
  message.value = ''
  open.value = true
}

async function submit(): Promise<void> {
  saving.value = true
  errors.value = {}
  try {
    if (editing.value) {
      await updatePlan(editing.value.id, { ...form })
      toast.success(`${form.name} quedó actualizado.`, 'Plan actualizado')
    } else {
      await createPlan({ ...form })
      toast.success(`${form.name} se agregó a la plataforma.`, 'Plan creado')
    }
    open.value = false
    await load()
  } catch (error) {
    errors.value = fieldErrors(error)
    message.value = errorMessage(error)
    toast.fromError(error, 'No se pudo guardar el plan')
  } finally {
    saving.value = false
  }
}

async function remove(plan: Plan): Promise<void> {
  if (!window.confirm(`¿Eliminar el plan ${plan.name}?`)) {
    return
  }

  try {
    await deletePlan(plan.id)
    await load()
    toast.success(`${plan.name} se eliminó.`, 'Plan eliminado')
  } catch (error) {
    message.value = errorMessage(error)
    toast.fromError(error, 'No se pudo eliminar el plan')
  }
}

onMounted(load)
</script>

<template>
  <PageHeader eyebrow="Red" title="Planes" hint="Suscripciones SaaS cobradas con Paddle. El e-commerce de cada tienda sigue aparte.">
    <button class="btn btn-accent" @click="start()">Nuevo plan</button>
  </PageHeader>

  <div v-if="message && !open" class="alert alert-danger">{{ message }}</div>

  <div class="fi-card overflow-auto">
    <table class="table fi-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Precio</th>
          <th>Comisión</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="5" class="p-4 text-secondary">Cargando…</td></tr>
        <tr v-else-if="!plans.length"><td colspan="5" class="p-4 text-secondary">Sin planes.</td></tr>
        <tr v-for="plan in plans" :key="plan.id">
          <td>
            <div class="fw-semibold">{{ plan.name }}</div>
            <div class="small text-secondary">{{ plan.slug }}</div>
          </td>
          <td>{{ money(plan.price, plan.currency) }} / {{ plan.interval === 'year' ? 'año' : 'mes' }}</td>
          <td>{{ plan.commission_percentage }}%</td>
          <td><StatusBadge :value="plan.is_active" /></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-dark me-2" @click="start(plan)">Editar</button>
            <button class="btn btn-sm btn-outline-danger" @click="remove(plan)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="open" class="modal-mask" @click.self="open = false">
    <div class="fi-card p-4" style="width: min(520px, 100%)">
      <h3 class="h5 mb-3">{{ editing ? 'Editar plan' : 'Nuevo plan' }}</h3>
      <div v-if="message" class="alert alert-danger">{{ message }}</div>
      <form class="d-grid gap-3" @submit.prevent="submit">
        <div>
          <label class="form-label">Nombre</label>
          <input v-model="form.name" class="form-control" required />
        </div>
        <div class="row g-3">
          <div class="col-6">
            <label class="form-label">Precio</label>
            <input v-model.number="form.price" type="number" min="0" step="0.01" class="form-control" required />
          </div>
          <div class="col-6">
            <label class="form-label">Moneda</label>
            <input class="form-control" value="USD" disabled />
            <p class="form-text mb-0">Las comisiones y planes del SaaS se cobran y pagan solo en dólares.</p>
          </div>
          <div class="col-6">
            <label class="form-label">Intervalo</label>
            <select v-model="form.interval" class="form-select">
              <option value="month">Mensual</option>
              <option value="year">Anual</option>
            </select>
          </div>
          <div class="col-6">
            <label class="form-label">% comisión</label>
            <input v-model.number="form.commission_percentage" type="number" min="0" max="100" class="form-control" />
          </div>
          <div class="col-12">
            <label class="form-label">ID de precio Paddle</label>
            <input v-model="form.paddle_price_id" class="form-control" placeholder="pri_..." />
            <p class="form-text mb-0">
              Crea el producto/precio recurrente en Paddle Billing y pega aquí el <code>pri_</code>.
              La tienda de cada líder no usa Paddle.
            </p>
          </div>
        </div>
        <label class="form-check">
          <input v-model="form.is_active" type="checkbox" class="form-check-input" />
          <span class="form-check-label">Activo</span>
        </label>
        <div class="d-flex gap-2 justify-content-end">
          <button type="button" class="btn btn-outline-secondary" @click="open = false">Cancelar</button>
          <button class="btn btn-accent" :disabled="saving">Guardar</button>
        </div>
      </form>
    </div>
  </div>
</template>
