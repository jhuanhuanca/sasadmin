<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchOrganizations } from '@/api/admin'
import PageHeader from '@/components/PageHeader.vue'
import type { Organization } from '@/types'
import { errorMessage } from '@/utils/http'

const items = ref<Organization[]>([])
const loading = ref(true)
const message = ref('')

onMounted(async () => {
  try {
    items.value = await fetchOrganizations()
  } catch (error) {
    message.value = errorMessage(error, 'No se pudieron cargar las organizaciones')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <PageHeader
    eyebrow="Red"
    title="Organizaciones"
    hint="Empresas MLM en REXmlm. El dato oficial de líderes (API, Excel u otro archivo) se carga en Datos de empresa."
  >
    <RouterLink to="/datos-empresa" class="btn btn-accent">Cargar API o Excel</RouterLink>
  </PageHeader>

  <div v-if="message" class="alert alert-danger">{{ message }}</div>
  <div v-else-if="loading" class="text-secondary">Cargando…</div>

  <div v-else class="fi-card overflow-auto">
    <table class="table fi-table mb-0">
      <thead>
        <tr>
          <th>Empresa</th>
          <th>Slug</th>
          <th>Zona por defecto</th>
          <th>Miembros</th>
          <th>Conector</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!items.length">
          <td colspan="6" class="p-4 text-secondary">Aún no hay organizaciones. Se crea HGW al sembrar, al registrar el primer líder, o desde Datos de empresa.</td>
        </tr>
        <tr v-for="item in items" :key="item.id" class="align-middle">
          <td>
            <RouterLink :to="`/organizations/${item.id}`" class="fw-semibold text-decoration-none">{{ item.name }}</RouterLink>
          </td>
          <td>{{ item.slug }}</td>
          <td>{{ item.default_timezone }}</td>
          <td>{{ item.members_count ?? 0 }}</td>
          <td>
            <span v-if="item.connector?.connected" class="badge text-bg-success">Conectada</span>
            <span v-else class="text-secondary">Sin sync</span>
          </td>
          <td class="text-end">
            <RouterLink :to="`/organizations/${item.id}`" class="btn btn-sm btn-accent">Cargar datos</RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
