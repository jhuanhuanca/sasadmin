<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { catalog, catalogList } from '@/api/catalog'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useCatalogStore } from '@/stores/catalog'
import { useToast } from '@/composables/useToast'
import type { Product } from '@/types'
import { CATALOG_COUNTRIES, countriesLabel } from '@/data/countries'
import { money } from '@/utils/format'
import { errorMessage, pageMeta, unwrapList } from '@/utils/http'

const catalogStore = useCatalogStore()
const { companyId } = storeToRefs(catalogStore)
const products = ref<Product[]>([])
const search = ref('')
const country = ref('')
const page = ref(1)
const lastPage = ref(1)
const total = ref(0)
const loading = ref(true)
const message = ref('')
const toast = useToast()

async function load(): Promise<void> {
  loading.value = true
  try {
    const payload = await catalogList<Product>('products', {
      company_id: companyId.value ?? undefined,
      search: search.value || undefined,
      country: country.value || undefined,
      page: page.value,
    })
    products.value = unwrapList(payload)
    const meta = pageMeta(payload)
    lastPage.value = meta.lastPage
    total.value = meta.total
  } catch (error) {
    message.value = errorMessage(error, 'No se pudieron cargar los productos')
  } finally {
    loading.value = false
  }
}

async function remove(product: Product): Promise<void> {
  if (!window.confirm(`¿Eliminar ${product.name}?`)) {
    return
  }
  try {
    await catalog(`products/${product.id}`, { method: 'DELETE' })
    await load()
    toast.success(`${product.name} se eliminó del catálogo.`, 'Producto eliminado')
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo eliminar el producto')
    toast.fromError(error, 'No se pudo eliminar el producto')
  }
}

watch([companyId, country], () => {
  page.value = 1
  void load()
})

onMounted(load)
</script>

<template>
  <PageHeader eyebrow="Catálogo" title="Productos" hint="Fichas, precios, códigos y países donde cada producto está activo.">
    <RouterLink to="/catalog/products/new" class="btn btn-accent">Nuevo producto</RouterLink>
  </PageHeader>

  <div class="fi-card p-3 mb-3">
    <div class="row g-2">
      <div class="col-md-6">
        <input v-model="search" class="form-control" placeholder="Buscar por nombre o código" @keyup.enter="page = 1; load()" />
      </div>
      <div class="col-md-3">
        <select v-model="country" class="form-select">
          <option value="">Todos los países</option>
          <option v-for="item in CATALOG_COUNTRIES" :key="item.code" :value="item.code">{{ item.name }}</option>
        </select>
      </div>
      <div class="col-md-3">
        <button class="btn btn-dark w-100" @click="page = 1; load()">Buscar</button>
      </div>
    </div>
  </div>

  <div v-if="message" class="alert alert-danger">{{ message }}</div>

  <div class="fi-card overflow-auto">
    <table class="table fi-table">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Código</th>
          <th>Empresa</th>
          <th>Países</th>
          <th>Precio</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="7" class="p-4 text-secondary">Cargando…</td></tr>
        <tr v-else-if="!products.length"><td colspan="7" class="p-4 text-secondary">Sin productos.</td></tr>
        <tr v-for="product in products" :key="product.id">
          <td class="fw-semibold">{{ product.name }}</td>
          <td>{{ product.code }}</td>
          <td>{{ product.company?.name ?? '—' }}</td>
          <td>{{ countriesLabel(product.countries) }}</td>
          <td>{{ money(product.price, product.currency) }}</td>
          <td><StatusBadge :value="product.is_active" /></td>
          <td class="text-end">
            <RouterLink :to="`/catalog/products/${product.id}`" class="btn btn-sm btn-outline-dark me-2">Editar</RouterLink>
            <button class="btn btn-sm btn-outline-danger" @click="remove(product)">Eliminar</button>
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
