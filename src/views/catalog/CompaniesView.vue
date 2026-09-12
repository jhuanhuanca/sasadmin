<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { catalog, catalogList } from '@/api/catalog'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useCatalogStore } from '@/stores/catalog'
import { useToast } from '@/composables/useToast'
import type { Company } from '@/types'
import { errorMessage, unwrapList } from '@/utils/http'

const catalogStore = useCatalogStore()
const companies = ref<Company[]>([])
const loading = ref(true)
const message = ref('')
const toast = useToast()

async function load(): Promise<void> {
  loading.value = true
  try {
    const payload = await catalogList<Company>('companies')
    companies.value = unwrapList(payload)
    await catalogStore.loadCompanies()
  } catch (error) {
    message.value = errorMessage(error, 'No se pudieron cargar las empresas. ¿Está corriendo serv_producmlm?')
  } finally {
    loading.value = false
  }
}

async function remove(company: Company): Promise<void> {
  if (!window.confirm(`¿Eliminar ${company.name}?`)) {
    return
  }

  try {
    await catalog(`companies/${company.id}`, { method: 'DELETE' })
    await load()
    toast.success(`${company.name} se eliminó del catálogo.`, 'Empresa eliminada')
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo eliminar la empresa')
    toast.fromError(error, 'No se pudo eliminar la empresa')
  }
}

onMounted(load)
</script>

<template>
  <PageHeader eyebrow="Catálogo" title="Empresas" hint="Compañías del microservicio serv_producmlm.">
    <RouterLink to="/catalog/companies/new" class="btn btn-accent">Nueva empresa</RouterLink>
  </PageHeader>

  <div v-if="message" class="alert alert-danger">{{ message }}</div>

  <div class="fi-card overflow-auto">
    <table class="table fi-table">
      <thead>
        <tr>
          <th>Empresa</th>
          <th>Web</th>
          <th>Productos</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="5" class="p-4 text-secondary">Cargando…</td></tr>
        <tr v-else-if="!companies.length"><td colspan="5" class="p-4 text-secondary">Aún no hay empresas.</td></tr>
        <tr v-for="company in companies" :key="company.id">
          <td>
            <div class="fw-semibold">{{ company.name }}</div>
            <div class="small text-secondary">{{ company.slug }}</div>
          </td>
          <td>{{ company.website || '—' }}</td>
          <td>{{ company.products_count ?? 0 }}</td>
          <td><StatusBadge :value="company.is_active" /></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-secondary me-2" @click="catalogStore.setCompany(company.id); toast.info(`${company.name} queda activa en el catálogo.`, 'Empresa seleccionada')">Usar</button>
            <RouterLink :to="`/catalog/companies/${company.id}`" class="btn btn-sm btn-outline-dark me-2">Editar</RouterLink>
            <button class="btn btn-sm btn-outline-danger" @click="remove(company)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
