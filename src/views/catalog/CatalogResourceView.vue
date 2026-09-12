<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { catalog, catalogList } from '@/api/catalog'
import PageHeader from '@/components/PageHeader.vue'
import { getResource, type ResourceField } from '@/data/catalogResources'
import { useCatalogStore } from '@/stores/catalog'
import { useToast } from '@/composables/useToast'
import type { CatalogItem } from '@/types'
import { errorMessage, fieldErrors, pageMeta, unwrapList } from '@/utils/http'

const route = useRoute()
const catalogStore = useCatalogStore()
const { companyId, products, currentCompany } = storeToRefs(catalogStore)

const resource = computed(() => getResource(String(route.meta.resource ?? '')))
const items = ref<CatalogItem[]>([])
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const errors = ref<Record<string, string[]>>({})
const open = ref(false)
const editing = ref<CatalogItem | null>(null)
const page = ref(1)
const lastPage = ref(1)
const form = reactive<Record<string, unknown>>({})
const toast = useToast()

const productOptions = computed(() =>
  products.value.map((product) => ({ value: String(product.id), label: `${product.code} · ${product.name}` })),
)

function fieldOptions(field: ResourceField): Array<{ value: string; label: string }> {
  if (field.key === 'product_id') {
    return productOptions.value
  }

  return field.options ?? []
}

function emptyForm(): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  for (const field of resource.value.fields) {
    if (field.type === 'checkbox') {
      next[field.key] = true
    } else if (field.type === 'number') {
      next[field.key] = 0
    } else if (field.type === 'items') {
      next[field.key] = []
    } else if (field.type === 'list') {
      next[field.key] = ''
    } else if (field.type === 'select') {
      next[field.key] = fieldOptions(field)[0]?.value ?? ''
    } else {
      next[field.key] = ''
    }
  }
  return next
}

function assignForm(values: Record<string, unknown>): void {
  const next = emptyForm()
  Object.assign(next, values)
  for (const field of resource.value.fields) {
    if (field.type === 'list' && Array.isArray(values[field.key])) {
      next[field.key] = (values[field.key] as unknown[]).map(String).join('\n')
    }
  }
  Object.keys(form).forEach((key) => {
    delete form[key]
  })
  Object.assign(form, next)
}

function cell(item: CatalogItem, key: string): string {
  const value = item[key]
  if (key === 'product_id') {
    const product = products.value.find((entry) => entry.id === Number(value))
    return product?.name ?? String(value ?? '—')
  }
  if (key === 'goal') {
    return value === 'gain_weight' ? 'Subir de peso' : value === 'lose_weight' ? 'Bajar de peso' : String(value ?? '—')
  }
  if (key === 'items') {
    const rows = Array.isArray(item.items) ? item.items : []
    if (!rows.length) {
      return 'Sin productos'
    }

    return rows
      .map((row) => {
        const product = (row as { product?: { name?: string; countries?: string[] }; product_id?: number }).product
        const name = product?.name || `#${(row as { product_id?: number }).product_id ?? '?'}`
        const countries = product?.countries
        const geo = !countries?.length ? 'todos los países' : countries.join(', ')

        return `${name} (${geo})`
      })
      .join(' · ')
  }
  if (Array.isArray(value)) {
    return value.length ? value.map(String).join(' · ') : '—'
  }
  return value == null || value === '' ? '—' : String(value)
}

async function load(): Promise<void> {
  if (resource.value.companyScoped && !companyId.value) {
    items.value = []
    loading.value = false
    message.value = 'Selecciona una empresa en la barra lateral.'
    return
  }

  loading.value = true
  message.value = ''
  try {
    await catalogStore.loadProducts()
    const query: Record<string, string | number | undefined> = { page: page.value }
    if (resource.value.id === 'categories' && companyId.value) {
      query.company_id = companyId.value
    }

    const payload = await catalogList<CatalogItem>(resource.value.listPath(companyId.value), query)
    items.value = unwrapList(payload)
    lastPage.value = pageMeta(payload).lastPage
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo cargar el listado')
  } finally {
    loading.value = false
  }
}

function start(item?: CatalogItem): void {
  editing.value = item ?? null
  assignForm(item ? { ...item } : emptyForm())
  if (Array.isArray(item?.items)) {
    form.items = (item.items as Array<Record<string, unknown>>).map((row) => ({
      product_id: Number(row.product_id ?? (row.product as { id?: number } | undefined)?.id ?? 0),
      quantity: Number(row.quantity ?? 1),
      notes: String(row.notes ?? ''),
    }))
  }
  errors.value = {}
  message.value = ''
  open.value = true
}

const itemRows = computed(() => (Array.isArray(form.items) ? form.items : []) as Array<Record<string, unknown>>)

function fieldText(key: string): string {
  const value = form[key]
  return value == null ? '' : String(value)
}

function fieldNumber(key: string): number {
  return Number(form[key] ?? 0)
}

function fieldChecked(key: string): boolean {
  return Boolean(form[key])
}

function setField(key: string, event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
    return
  }

  if (target instanceof HTMLInputElement && target.type === 'checkbox') {
    form[key] = target.checked
    return
  }

  if (target instanceof HTMLInputElement && target.type === 'number') {
    form[key] = Number(target.value)
    return
  }

  form[key] = key === 'product_id' ? Number(target.value) : target.value
}

function addItem(): void {
  const rows = Array.isArray(form.items) ? [...(form.items as Array<Record<string, unknown>>)] : []
  rows.push({ product_id: products.value[0]?.id ?? 0, quantity: 1, notes: '' })
  form.items = rows
}

function removeItem(index: number): void {
  const rows = [...((form.items as Array<Record<string, unknown>>) ?? [])]
  rows.splice(index, 1)
  form.items = rows
}

async function submit(): Promise<void> {
  saving.value = true
  errors.value = {}
  try {
    const body: Record<string, unknown> = { ...form }
    if (resource.value.companyScoped && resource.value.id === 'categories') {
      body.company_id = companyId.value
    }
    if (body.category_id === 0) {
      body.category_id = null
    }
    for (const field of resource.value.fields) {
      if (field.type !== 'list') {
        continue
      }

      body[field.key] = String(body[field.key] ?? '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    }

    if (editing.value) {
      await catalog(resource.value.itemPath(Number(editing.value.id)), { method: 'PUT', body })
      toast.success('Los cambios ya están en el catálogo.', `${resource.value.title} actualizado`)
    } else {
      await catalog(resource.value.listPath(companyId.value), { method: 'POST', body })
      toast.success('El registro se agregó al catálogo.', `${resource.value.title} creado`)
    }
    open.value = false
    await load()
  } catch (error) {
    errors.value = fieldErrors(error)
    message.value = errorMessage(error)
    toast.fromError(error, 'No se pudo guardar')
  } finally {
    saving.value = false
  }
}

async function remove(item: CatalogItem): Promise<void> {
  if (!window.confirm('¿Eliminar este registro?')) {
    return
  }
  try {
    await catalog(resource.value.itemPath(Number(item.id)), { method: 'DELETE' })
    await load()
    toast.success('El registro se quitó del catálogo.', `${resource.value.title} eliminado`)
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo eliminar')
    toast.fromError(error, 'No se pudo eliminar')
  }
}

watch(
  () => [route.meta.resource, companyId.value],
  () => {
    page.value = 1
    void load()
  },
)

onMounted(load)
</script>

<template>
  <PageHeader :eyebrow="currentCompany?.name ?? 'Catálogo'" :title="resource.title" :hint="resource.hint">
    <button class="btn btn-accent" :disabled="resource.companyScoped && !companyId" @click="start()">Nuevo</button>
  </PageHeader>

  <div v-if="message && !open" class="alert" :class="companyId ? 'alert-danger' : 'alert-warning'">{{ message }}</div>

  <div class="fi-card overflow-auto">
    <table class="table fi-table">
      <thead>
        <tr>
          <th v-for="column in resource.columns" :key="column.key">{{ column.label }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td :colspan="resource.columns.length + 1" class="p-4 text-secondary">Cargando…</td></tr>
        <tr v-else-if="!items.length"><td :colspan="resource.columns.length + 1" class="p-4 text-secondary">Sin registros.</td></tr>
        <tr v-for="item in items" :key="String(item.id)">
          <td v-for="column in resource.columns" :key="column.key">{{ cell(item, column.key) }}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-dark me-2" @click="start(item)">Editar</button>
            <button class="btn btn-sm btn-outline-danger" @click="remove(item)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="lastPage > 1" class="d-flex justify-content-end mt-3">
    <div class="btn-group">
      <button class="btn btn-sm btn-outline-secondary" :disabled="page <= 1" @click="page -= 1; load()">Anterior</button>
      <button class="btn btn-sm btn-outline-secondary" disabled>{{ page }} / {{ lastPage }}</button>
      <button class="btn btn-sm btn-outline-secondary" :disabled="page >= lastPage" @click="page += 1; load()">Siguiente</button>
    </div>
  </div>

  <div v-if="open" class="modal-mask" @click.self="open = false">
    <div class="fi-card p-4" style="width: min(640px, 100%); max-height: 90vh; overflow: auto">
      <h3 class="h5 mb-3">{{ editing ? 'Editar' : 'Nuevo' }} · {{ resource.title }}</h3>
      <div v-if="message" class="alert alert-danger">{{ message }}</div>
      <form class="d-grid gap-3" @submit.prevent="submit">
        <div v-for="field in resource.fields" :key="field.key">
          <label class="form-label">{{ field.label }}</label>
          <input
            v-if="field.type === 'text' || field.type === 'url'"
            :value="fieldText(field.key)"
            class="form-control"
            :required="field.required"
            :type="field.type === 'url' ? 'url' : 'text'"
            @input="setField(field.key, $event)"
          />
          <textarea
            v-else-if="field.type === 'textarea' || field.type === 'list'"
            :value="fieldText(field.key)"
            class="form-control"
            rows="4"
            @input="setField(field.key, $event)"
          />
          <input
            v-else-if="field.type === 'number'"
            :value="fieldNumber(field.key)"
            type="number"
            class="form-control"
            :min="0"
            :step="field.key === 'price' ? '0.01' : '1'"
            :required="field.required"
            @input="setField(field.key, $event)"
          />
          <select
            v-else-if="field.type === 'select'"
            :value="form[field.key]"
            class="form-select"
            :required="field.required"
            @change="setField(field.key, $event)"
          >
            <option v-for="option in fieldOptions(field)" :key="option.value" :value="field.key === 'product_id' ? Number(option.value) : option.value">
              {{ option.label }}
            </option>
          </select>
          <label v-else-if="field.type === 'checkbox'" class="form-check">
            <input :checked="fieldChecked(field.key)" type="checkbox" class="form-check-input" @change="setField(field.key, $event)" />
            <span class="form-check-label">Activo</span>
          </label>
          <div v-else-if="field.type === 'items'">
            <div v-for="(row, index) in itemRows" :key="index" class="row g-2 mb-2">
              <div class="col-md-6">
                <select v-model.number="row.product_id" class="form-select">
                  <option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option>
                </select>
              </div>
              <div class="col-md-3">
                <input v-model.number="row.quantity" type="number" min="1" class="form-control" />
              </div>
              <div class="col-md-3">
                <button type="button" class="btn btn-outline-danger w-100" @click="removeItem(index)">Quitar</button>
              </div>
            </div>
            <button type="button" class="btn btn-outline-dark btn-sm" @click="addItem">Agregar producto</button>
          </div>
          <div v-if="errors[field.key]" class="form-text text-danger">{{ errors[field.key][0] }}</div>
        </div>
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-secondary" @click="open = false">Cancelar</button>
          <button class="btn btn-accent" :disabled="saving">Guardar</button>
        </div>
      </form>
    </div>
  </div>
</template>
