<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { catalog, catalogList } from '@/api/catalog'
import PageHeader from '@/components/PageHeader.vue'
import { useCatalogStore } from '@/stores/catalog'
import { useToast } from '@/composables/useToast'
import type { Category, Product } from '@/types'
import { CATALOG_COUNTRIES } from '@/data/countries'
import { STORE_CURRENCIES } from '@/data/currencies'
import { errorMessage, fieldErrors, unwrapData, unwrapList } from '@/utils/http'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()
const { companies, companyId } = storeToRefs(catalogStore)
const id = computed(() => {
  const value = Number(route.params.id)
  return Number.isFinite(value) && value > 0 ? value : null
})

const categories = ref<Category[]>([])
const form = reactive({
  company_id: companyId.value ?? 0,
  category_id: 0,
  code: '',
  name: '',
  image: '',
  description: '',
  technical_sheet: '',
  price: 0,
  currency: 'USD',
  is_active: true,
  countries: [] as string[],
})
const errors = ref<Record<string, string[]>>({})
const message = ref('')
const loading = ref(Boolean(id.value))
const saving = ref(false)
const toast = useToast()

async function loadCategories(nextCompanyId: number): Promise<void> {
  if (!nextCompanyId) {
    categories.value = []
    return
  }

  const payload = await catalogList<Category>('categories', { company_id: nextCompanyId })
  categories.value = unwrapList(payload)
}

onMounted(async () => {
  if (!catalogStore.loaded) {
    await catalogStore.loadCompanies()
  }

  if (!form.company_id && companyId.value) {
    form.company_id = companyId.value
  }

  if (id.value) {
    try {
      const product = unwrapData(await catalog<Product | { data: Product }>(`products/${id.value}`))
      form.company_id = product.company_id
      form.category_id = product.category_id ?? 0
      form.code = product.code
      form.name = product.name
      form.image = product.image ?? ''
      form.description = product.description ?? ''
      form.technical_sheet = product.technical_sheet ?? ''
      form.price = Number(product.price ?? 0)
      form.currency = product.currency || 'USD'
      form.is_active = product.is_active
      form.countries = [...(product.countries ?? [])]
    } catch (error) {
      message.value = errorMessage(error, 'No se pudo cargar el producto')
    } finally {
      loading.value = false
    }
  }

  await loadCategories(form.company_id)
})

async function onCompanyChange(): Promise<void> {
  form.category_id = 0
  await loadCategories(form.company_id)
}

async function submit(): Promise<void> {
  saving.value = true
  errors.value = {}
  message.value = ''

  const body = {
    company_id: form.company_id,
    category_id: form.category_id || null,
    code: form.code,
    name: form.name,
    image: form.image || null,
    description: form.description || null,
    technical_sheet: form.technical_sheet || null,
    price: form.price,
    currency: form.currency,
    is_active: form.is_active,
    countries: form.countries,
  }

  try {
    if (id.value) {
      await catalog(`products/${id.value}`, { method: 'PUT', body })
      toast.success(`${form.name} quedó actualizado.`, 'Producto actualizado')
    } else {
      await catalog('products', { method: 'POST', body })
      toast.success(`${form.name} se agregó al catálogo.`, 'Producto creado')
    }
    await router.push({ name: 'products' })
  } catch (error) {
    errors.value = fieldErrors(error)
    message.value = errorMessage(error)
    toast.fromError(error, 'No se pudo guardar el producto')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <PageHeader eyebrow="Catálogo" :title="id ? 'Editar producto' : 'Nuevo producto'">
    <RouterLink to="/catalog/products" class="btn btn-outline-secondary">Volver</RouterLink>
  </PageHeader>

  <div v-if="loading" class="text-secondary">Cargando…</div>
  <form v-else class="fi-card p-4" style="max-width: 860px" @submit.prevent="submit">
    <div v-if="message" class="alert alert-danger">{{ message }}</div>
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Empresa</label>
        <select v-model.number="form.company_id" class="form-select" required @change="onCompanyChange">
          <option :value="0" disabled>Selecciona</option>
          <option v-for="company in companies" :key="company.id" :value="company.id">{{ company.name }}</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Categoría</label>
        <select v-model.number="form.category_id" class="form-select">
          <option :value="0">Sin categoría</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label">Código</label>
        <input v-model="form.code" class="form-control" required />
        <div v-if="errors.code" class="form-text text-danger">{{ errors.code[0] }}</div>
      </div>
      <div class="col-md-5">
        <label class="form-label">Nombre</label>
        <input v-model="form.name" class="form-control" required />
      </div>
      <div class="col-md-3">
        <label class="form-label">Precio</label>
        <input v-model.number="form.price" type="number" min="0" step="0.01" class="form-control" />
      </div>
      <div class="col-md-3">
        <label class="form-label">Moneda</label>
        <select v-model="form.currency" class="form-select">
          <option v-for="item in STORE_CURRENCIES" :key="item.code" :value="item.code">{{ item.label }}</option>
        </select>
      </div>
      <div class="col-12">
        <label class="form-label">Imagen (URL)</label>
        <input v-model="form.image" class="form-control" />
      </div>
      <div class="col-12">
        <label class="form-label">Descripción</label>
        <textarea v-model="form.description" class="form-control" rows="3" />
      </div>
      <div class="col-12">
        <label class="form-label">Ficha técnica</label>
        <textarea v-model="form.technical_sheet" class="form-control" rows="5" />
      </div>
      <div class="col-12">
        <label class="form-label">Países donde está activo</label>
        <p class="form-text mt-0 mb-2">Si no marcas ninguno, el producto está disponible en todos los países.</p>
        <div class="row g-2">
          <div v-for="country in CATALOG_COUNTRIES" :key="country.code" class="col-sm-6 col-md-4 col-lg-3">
            <label class="form-check">
              <input v-model="form.countries" type="checkbox" class="form-check-input" :value="country.code" />
              <span class="form-check-label">{{ country.name }}</span>
            </label>
          </div>
        </div>
        <div v-if="errors.countries" class="form-text text-danger">{{ errors.countries[0] }}</div>
      </div>
      <div class="col-12">
        <label class="form-check">
          <input v-model="form.is_active" type="checkbox" class="form-check-input" />
          <span class="form-check-label">Producto activo</span>
        </label>
      </div>
    </div>
    <button class="btn btn-accent mt-4" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
  </form>
</template>
