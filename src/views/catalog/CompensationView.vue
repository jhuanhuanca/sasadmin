<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { catalog, catalogList } from '@/api/catalog'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useCatalogStore } from '@/stores/catalog'
import { useToast } from '@/composables/useToast'
import { errorMessage, fieldErrors, unwrapList } from '@/utils/http'

type Pack = { name: string; description: string; pv: number; cost: number }
type Bonus = { name: string; description: string; advantage: string }
type Plan = {
  id: number
  name: string
  network_type: string
  network_description?: string
  network_example?: string
  network_advantages?: string
  is_active: boolean
  packages?: Pack[]
  bonuses?: Bonus[]
}

const catalogStore = useCatalogStore()
const { companyId, currentCompany } = storeToRefs(catalogStore)
const plans = ref<Plan[]>([])
const loading = ref(true)
const saving = ref(false)
const open = ref(false)
const toast = useToast()
const editing = ref<Plan | null>(null)
const message = ref('')
const errors = ref<Record<string, string[]>>({})

const form = reactive({
  name: '',
  network_type: 'binario',
  network_description: '',
  network_example: '',
  network_advantages: '',
  is_active: true,
  packages: [] as Pack[],
  bonuses: [] as Bonus[],
})

async function load(): Promise<void> {
  if (!companyId.value) {
    plans.value = []
    loading.value = false
    message.value = 'Selecciona una empresa en la barra lateral.'
    return
  }

  loading.value = true
  message.value = ''
  try {
    const payload = await catalogList<Plan>(`companies/${companyId.value}/compensation-plans`)
    plans.value = unwrapList(payload)
  } catch (error) {
    message.value = errorMessage(error, 'No se pudieron cargar los planes de compensación')
  } finally {
    loading.value = false
  }
}

function start(plan?: Plan): void {
  editing.value = plan ?? null
  form.name = plan?.name ?? ''
  form.network_type = plan?.network_type ?? 'binario'
  form.network_description = plan?.network_description ?? ''
  form.network_example = plan?.network_example ?? ''
  form.network_advantages = plan?.network_advantages ?? ''
  form.is_active = plan?.is_active ?? true
  form.packages = (plan?.packages ?? []).map((row) => ({
    name: row.name,
    description: row.description ?? '',
    pv: Number(row.pv ?? 0),
    cost: Number(row.cost ?? 0),
  }))
  form.bonuses = (plan?.bonuses ?? []).map((row) => ({
    name: row.name,
    description: row.description ?? '',
    advantage: row.advantage ?? '',
  }))
  errors.value = {}
  message.value = ''
  open.value = true
}

async function submit(): Promise<void> {
  if (!companyId.value) {
    return
  }

  saving.value = true
  try {
    const body = { ...form }
    if (editing.value) {
      await catalog(`compensation-plans/${editing.value.id}`, { method: 'PUT', body })
    } else {
      await catalog(`companies/${companyId.value}/compensation-plans`, { method: 'POST', body })
    }
    open.value = false
    await load()
    toast.success(
      editing.value ? 'El plan de compensación se actualizó.' : 'El plan de compensación se creó.',
      editing.value ? 'Plan actualizado' : 'Plan creado',
    )
  } catch (error) {
    errors.value = fieldErrors(error)
    message.value = errorMessage(error)
    toast.fromError(error, 'No se pudo guardar el plan')
  } finally {
    saving.value = false
  }
}

watch(companyId, () => {
  void load()
})

onMounted(load)
</script>

<template>
  <PageHeader
    :eyebrow="currentCompany?.name ?? 'Catálogo'"
    title="Plan de compensación"
    hint="Paquetes y bonos de la empresa. Los rangos se cargan en Catálogo → Rangos."
  >
    <RouterLink to="/catalog/ranks" class="btn btn-outline-dark">Rangos</RouterLink>
    <button class="btn btn-accent" :disabled="!companyId" @click="start()">Nuevo plan</button>
  </PageHeader>

  <div v-if="message && !open" class="alert" :class="companyId ? 'alert-danger' : 'alert-warning'">{{ message }}</div>

  <div class="fi-card overflow-auto">
    <table class="table fi-table">
      <thead>
        <tr>
          <th>Plan</th>
          <th>Red</th>
          <th>Paquetes</th>
          <th>Bonos</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="6" class="p-4 text-secondary">Cargando…</td></tr>
        <tr v-else-if="!plans.length"><td colspan="6" class="p-4 text-secondary">Sin planes.</td></tr>
        <tr v-for="plan in plans" :key="plan.id">
          <td class="fw-semibold">{{ plan.name }}</td>
          <td>{{ plan.network_type }}</td>
          <td>{{ plan.packages?.length ?? 0 }}</td>
          <td>{{ plan.bonuses?.length ?? 0 }}</td>
          <td><StatusBadge :value="plan.is_active" /></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-dark" @click="start(plan)">Editar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="open" class="modal-mask" @click.self="open = false">
    <div class="fi-card p-4" style="width: min(760px, 100%); max-height: 92vh; overflow: auto">
      <h3 class="h5 mb-3">{{ editing ? 'Editar plan' : 'Nuevo plan' }}</h3>
      <div v-if="message" class="alert alert-danger">{{ message }}</div>
      <form class="d-grid gap-3" @submit.prevent="submit">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Nombre</label>
            <input v-model="form.name" class="form-control" required />
          </div>
          <div class="col-md-6">
            <label class="form-label">Tipo de red</label>
            <input v-model="form.network_type" class="form-control" required />
          </div>
          <div class="col-12">
            <label class="form-label">Descripción</label>
            <textarea v-model="form.network_description" class="form-control" rows="2" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Ejemplo</label>
            <textarea v-model="form.network_example" class="form-control" rows="2" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Ventajas</label>
            <textarea v-model="form.network_advantages" class="form-control" rows="2" />
          </div>
        </div>
        <label class="form-check">
          <input v-model="form.is_active" type="checkbox" class="form-check-input" />
          <span class="form-check-label">Activo</span>
        </label>

        <div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <strong>Paquetes</strong>
            <button type="button" class="btn btn-sm btn-outline-dark" @click="form.packages.push({ name: '', description: '', pv: 0, cost: 0 })">Agregar</button>
          </div>
          <div v-for="(pack, index) in form.packages" :key="`p-${index}`" class="row g-2 mb-2">
            <div class="col-md-4"><input v-model="pack.name" class="form-control" placeholder="Nombre" /></div>
            <div class="col-md-3"><input v-model.number="pack.pv" type="number" class="form-control" placeholder="PV" /></div>
            <div class="col-md-3"><input v-model.number="pack.cost" type="number" class="form-control" placeholder="Costo" /></div>
            <div class="col-md-2"><button type="button" class="btn btn-outline-danger w-100" @click="form.packages.splice(index, 1)">Quitar</button></div>
          </div>
        </div>

        <div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <strong>Bonos</strong>
            <button type="button" class="btn btn-sm btn-outline-dark" @click="form.bonuses.push({ name: '', description: '', advantage: '' })">Agregar</button>
          </div>
          <div v-for="(bonus, index) in form.bonuses" :key="`b-${index}`" class="row g-2 mb-2">
            <div class="col-md-4"><input v-model="bonus.name" class="form-control" placeholder="Nombre" /></div>
            <div class="col-md-4"><input v-model="bonus.description" class="form-control" placeholder="Descripción" /></div>
            <div class="col-md-3"><input v-model="bonus.advantage" class="form-control" placeholder="Ventaja" /></div>
            <div class="col-md-1"><button type="button" class="btn btn-outline-danger w-100" @click="form.bonuses.splice(index, 1)">×</button></div>
          </div>
        </div>

        <div v-if="errors.name" class="text-danger small">{{ errors.name[0] }}</div>
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-secondary" @click="open = false">Cancelar</button>
          <button class="btn btn-accent" :disabled="saving">Guardar</button>
        </div>
      </form>
    </div>
  </div>
</template>
