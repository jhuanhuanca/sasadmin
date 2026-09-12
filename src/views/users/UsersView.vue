<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { deleteUser, fetchUsers } from '@/api/admin'
import { catalogList } from '@/api/catalog'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { AdminUser, Company } from '@/types'
import { useToast } from '@/composables/useToast'
import { roleLabel, roleNames } from '@/utils/format'
import { errorMessage, pageMeta, unwrapList } from '@/utils/http'

const route = useRoute()
const users = ref<AdminUser[]>([])
const companies = ref<Company[]>([])
const search = ref('')
const role = ref(typeof route.meta.role === 'string' ? route.meta.role : '')
const catalogCompanyId = ref('')
const page = ref(1)
const lastPage = ref(1)
const total = ref(0)
const loading = ref(true)
const message = ref('')
const toast = useToast()

const title = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : 'Usuarios'))
const isPartners = computed(() => route.name === 'partners')

function companyRows(user: AdminUser): Array<{ id: number; name: string; primary: boolean }> {
  if (user.companies?.length) {
    return user.companies.map((row) => ({
      id: row.catalog_company_id,
      name: row.catalog_company_name || `Empresa #${row.catalog_company_id}`,
      primary: Boolean(row.is_primary),
    }))
  }

  if (user.catalog_company_id) {
    return [
      {
        id: user.catalog_company_id,
        name: user.catalog_company_name || `Empresa #${user.catalog_company_id}`,
        primary: true,
      },
    ]
  }

  return []
}

async function loadCompanies(): Promise<void> {
  try {
    const payload = await catalogList<Company>('companies')
    companies.value = unwrapList(payload)
  } catch {
    companies.value = []
  }
}

async function load(): Promise<void> {
  loading.value = true
  message.value = ''
  try {
    const payload = await fetchUsers({
      search: search.value || undefined,
      role: role.value || undefined,
      catalog_company_id: catalogCompanyId.value || undefined,
      page: page.value,
    })
    users.value = payload.data ?? []
    const meta = pageMeta(payload)
    lastPage.value = meta.lastPage
    total.value = meta.total
  } catch (error) {
    message.value = errorMessage(error, 'No se pudieron cargar los usuarios')
  } finally {
    loading.value = false
  }
}

async function remove(user: AdminUser): Promise<void> {
  if (!window.confirm(`¿Desactivar a ${user.name}?`)) {
    return
  }

  try {
    await deleteUser(user.id)
    await load()
    toast.success(`${user.name} quedó desactivado.`, 'Usuario desactivado')
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo desactivar el usuario')
    toast.fromError(error, 'No se pudo desactivar el usuario')
  }
}

watch(
  () => route.name,
  () => {
    role.value = typeof route.meta.role === 'string' ? route.meta.role : ''
    page.value = 1
    void load()
  },
)

onMounted(() => {
  void loadCompanies()
  void load()
})
</script>

<template>
  <PageHeader
    eyebrow="Red"
    :title="title"
    :hint="isPartners ? 'Socios de la red y la empresa del catálogo con la que se registraron.' : 'Cuentas de la plataforma con la empresa del catálogo asignada al registrarse.'"
  >
    <RouterLink to="/users/new" class="btn btn-accent">Nuevo usuario</RouterLink>
  </PageHeader>

  <div class="fi-card p-3 mb-3">
    <div class="row g-2">
      <div class="col-md-4">
        <input v-model="search" class="form-control" placeholder="Buscar nombre, correo o empresa" @keyup.enter="page = 1; load()" />
      </div>
      <div class="col-md-3">
        <select v-model="role" class="form-select" @change="page = 1; load()">
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="leader">Líder</option>
          <option value="partner">Socio</option>
        </select>
      </div>
      <div class="col-md-3">
        <select v-model="catalogCompanyId" class="form-select" @change="page = 1; load()">
          <option value="">Todas las empresas</option>
          <option value="none">Sin empresa</option>
          <option v-for="company in companies" :key="company.id" :value="String(company.id)">
            {{ company.name }}
          </option>
        </select>
      </div>
      <div class="col-md-2">
        <button class="btn btn-dark w-100" @click="page = 1; load()">Filtrar</button>
      </div>
    </div>
  </div>

  <div v-if="message" class="alert alert-danger">{{ message }}</div>

  <div class="fi-card overflow-auto">
    <table class="table fi-table align-middle">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Empresa</th>
          <th>Rango</th>
          <th>Rol</th>
          <th>Estado</th>
          <th>Referidos</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="8" class="text-secondary p-4">Cargando…</td>
        </tr>
        <tr v-else-if="!users.length">
          <td colspan="8" class="text-secondary p-4">No hay registros.</td>
        </tr>
        <tr v-for="user in users" :key="user.id">
          <td class="fw-semibold">{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>
            <div v-if="companyRows(user).length" class="d-flex flex-column gap-1">
              <RouterLink
                v-for="company in companyRows(user)"
                :key="`${user.id}-${company.id}`"
                :to="`/catalog/companies/${company.id}`"
                class="text-decoration-none"
              >
                {{ company.name }}
                <span v-if="companyRows(user).length > 1 && company.primary" class="text-secondary small">(principal)</span>
              </RouterLink>
            </div>
            <span v-else class="text-secondary">Sin empresa</span>
          </td>
          <td>{{ user.catalog_rank_name || '—' }}</td>
          <td>{{ roleNames(user).map(roleLabel).join(', ') || '—' }}</td>
          <td><StatusBadge :value="user.status" /></td>
          <td>{{ user.referrals_count ?? 0 }}</td>
          <td class="text-end">
            <RouterLink :to="`/users/${user.id}`" class="btn btn-sm btn-outline-dark me-2">Editar</RouterLink>
            <button class="btn btn-sm btn-outline-danger" @click="remove(user)">Desactivar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="lastPage > 1" class="d-flex justify-content-between align-items-center mt-3">
    <span class="small text-secondary">{{ total }} registros</span>
    <div class="btn-group">
      <button class="btn btn-outline-secondary btn-sm" :disabled="page <= 1" @click="page -= 1; load()">Anterior</button>
      <button class="btn btn-outline-secondary btn-sm" disabled>{{ page }} / {{ lastPage }}</button>
      <button class="btn btn-outline-secondary btn-sm" :disabled="page >= lastPage" @click="page += 1; load()">Siguiente</button>
    </div>
  </div>
</template>
