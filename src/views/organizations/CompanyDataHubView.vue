<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { createOrganization, fetchOrganizations } from '@/api/admin'
import { catalogList } from '@/api/catalog'
import PageHeader from '@/components/PageHeader.vue'
import type { Company, Organization } from '@/types'
import { useToast } from '@/composables/useToast'
import { errorMessage, unwrapData, unwrapList } from '@/utils/http'

const items = ref<Organization[]>([])
const companies = ref<Company[]>([])
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const notice = ref('')
const toast = useToast()
const form = reactive({ name: '', catalog_company_id: '' as string | number | '' })

const availableCatalog = computed(() => {
  const linked = new Set(items.value.map((item) => item.catalog_company_id).filter(Boolean))
  return companies.value.filter((company) => !linked.has(company.id))
})

function driverLabel(driver: string): string {
  if (driver === 'api') {
    return 'API'
  }
  if (driver === 'excel') {
    return 'Excel / CSV'
  }
  if (driver === 'catalog') {
    return 'Catálogo'
  }
  if (driver === 'other') {
    return 'Otro archivo'
  }
  return driver
}

async function load(): Promise<void> {
  loading.value = true
  message.value = ''
  try {
    const [orgs, catalog] = await Promise.allSettled([
      fetchOrganizations(),
      catalogList<Company>('companies', { per_page: 100 }),
    ])
    items.value = orgs.status === 'fulfilled' ? orgs.value : []
    companies.value = catalog.status === 'fulfilled' ? unwrapList(catalog.value) : []
  } catch (error) {
    message.value = errorMessage(error, 'No se pudieron cargar las empresas')
  } finally {
    loading.value = false
  }
}

async function create(): Promise<void> {
  if (!form.name.trim()) {
    return
  }
  saving.value = true
  message.value = ''
  notice.value = ''
  try {
    const created = unwrapData(
      await createOrganization({
        name: form.name.trim(),
        catalog_company_id: form.catalog_company_id === '' ? null : Number(form.catalog_company_id),
      }),
    )
    form.name = ''
    form.catalog_company_id = ''
    notice.value = `${created.name} lista. Entra y sube la API o el Excel de sus líderes.`
    toast.success(notice.value, 'Empresa dada de alta')
    await load()
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo dar de alta la empresa')
    toast.fromError(error, 'No se pudo dar de alta la empresa')
  } finally {
    saving.value = false
  }
}

function onCatalogChange(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) {
    return
  }
  form.catalog_company_id = target.value
  const company = companies.value.find((item) => String(item.id) === target.value)
  if (company && !form.name.trim()) {
    form.name = company.name
  }
}

onMounted(load)
</script>

<template>
  <PageHeader
    eyebrow="Administrador"
    title="Datos de empresa"
    hint="Aquí cargas el dato oficial de cada marca (HGW, DXN, Face Global, Omnilife…). API del backoffice, Excel/CSV de líderes u otro archivo. Cada líder, en sasmlm, solo verá su red."
  />

  <div v-if="message" class="alert alert-danger">{{ message }}</div>
  <div v-if="notice" class="alert alert-success">{{ notice }}</div>
  <div v-if="loading" class="text-secondary">Cargando…</div>

  <template v-else>
    <div class="row g-3">
      <div v-for="item in items" :key="item.id" class="col-lg-6">
        <section class="fi-card p-4 h-100">
          <div class="d-flex justify-content-between gap-3">
            <div>
              <h2 class="h5 mb-1">{{ item.name }}</h2>
              <p class="small text-secondary mb-0">
                {{ item.members_count ?? 0 }} líderes/socios en REXmlm
                · {{ item.default_timezone }}
              </p>
            </div>
            <span v-if="item.connector?.connected" class="badge text-bg-success align-self-start">Con datos</span>
            <span v-else class="badge text-bg-light align-self-start">Sin sync</span>
          </div>
          <p v-if="item.connector?.drivers?.length" class="small mt-3 mb-0">
            Medios:
            {{ item.connector.drivers.map(driverLabel).join(' · ') }}
          </p>
          <p v-else class="small text-secondary mt-3 mb-0">
            Todavía no hay API ni archivo. Los líderes no tendrán PV/GV oficiales hasta que subas el dato.
          </p>
          <div class="d-flex flex-wrap gap-2 mt-4">
            <RouterLink :to="`/organizations/${item.id}`" class="btn btn-accent">
              Cargar API, Excel u otro archivo
            </RouterLink>
            <RouterLink :to="`/organizations/${item.id}`" class="btn btn-outline-dark btn-sm">
              Ver conexiones
            </RouterLink>
          </div>
        </section>
      </div>

      <div class="col-lg-6">
        <section class="fi-card p-4 h-100">
          <h2 class="h5">Alta de empresa</h2>
          <p class="small text-secondary">
            Si la marca aún no aparece, créala aquí (puedes ligarla a una empresa del catálogo).
            Luego subes su API o el Excel con el padrón de líderes.
          </p>
          <label class="form-label">Empresa del catálogo (opcional)</label>
          <select class="form-select mb-2" :value="form.catalog_company_id" @change="onCatalogChange">
            <option value="">Sin ligar / escribir el nombre</option>
            <option v-for="company in availableCatalog" :key="company.id" :value="company.id">
              {{ company.name }}
            </option>
          </select>
          <label class="form-label">Nombre</label>
          <input v-model="form.name" class="form-control mb-3" placeholder="HGW, DXN, Face Global…" />
          <button class="btn btn-dark" type="button" :disabled="saving || !form.name.trim()" @click="create">
            {{ saving ? 'Creando…' : 'Crear y preparar carga' }}
          </button>
        </section>
      </div>
    </div>

    <p v-if="!items.length" class="text-secondary mt-3 mb-0">
      No hay organizaciones todavía. Crea HGW u otra marca arriba; no hace falta que un líder se haya registrado antes.
    </p>
  </template>
</template>
