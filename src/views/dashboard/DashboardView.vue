<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchCommissions, fetchUsers } from '@/api/admin'
import { catalogList } from '@/api/catalog'
import PageHeader from '@/components/PageHeader.vue'
import { useAuthStore } from '@/stores/auth'
import type { Company, Product } from '@/types'
import { pageMeta } from '@/utils/http'

const auth = useAuthStore()
const loading = ref(true)
const stats = ref({
  users: 0,
  partners: 0,
  commissions: 0,
  companies: 0,
  products: 0,
})

onMounted(async () => {
  try {
    const [users, partners, commissions, companies, products] = await Promise.allSettled([
      fetchUsers({ per_page: 1 }),
      fetchUsers({ role: 'partner', per_page: 1 }),
      fetchCommissions({ status: 'pending', per_page: 1 }),
      catalogList<Company>('companies'),
      catalogList<Product>('products'),
    ])

    stats.value = {
      users: users.status === 'fulfilled' ? pageMeta(users.value).total : 0,
      partners: partners.status === 'fulfilled' ? pageMeta(partners.value).total : 0,
      commissions: commissions.status === 'fulfilled' ? pageMeta(commissions.value).total : 0,
      companies: companies.status === 'fulfilled' ? pageMeta(companies.value).total : 0,
      products: products.status === 'fulfilled' ? pageMeta(products.value).total : 0,
    }
  } finally {
    loading.value = false
  }
})

const cards = [
  { key: 'users', label: 'Usuarios', to: '/users', icon: 'bi-people' },
  { key: 'partners', label: 'Socios', to: '/partners', icon: 'bi-person-hearts' },
  { key: 'commissions', label: 'Comisiones pendientes', to: '/commissions', icon: 'bi-cash-stack' },
  { key: 'companies', label: 'Empresas', to: '/catalog/companies', icon: 'bi-buildings' },
  { key: 'products', label: 'Productos', to: '/catalog/products', icon: 'bi-box-seam' },
] as const
</script>

<template>
  <PageHeader
    eyebrow="Resumen"
    title="Panel de control"
    hint="Administra la red REXmlm y el catálogo de serv_producmlm."
  />

  <div v-if="auth.recoveryCodes.length" class="alert alert-warning">
    <p class="fw-semibold mb-2">Guarda estos códigos de recuperación. Solo se muestran ahora.</p>
    <ul class="mb-3 font-monospace">
      <li v-for="item in auth.recoveryCodes" :key="item">{{ item }}</li>
    </ul>
    <button type="button" class="btn btn-sm btn-dark" @click="auth.dismissRecoveryCodes()">Ya los guardé</button>
  </div>

  <div v-if="loading" class="text-secondary">Cargando métricas…</div>
  <div v-else class="row g-3">
    <div v-for="card in cards" :key="card.key" class="col-md-6 col-xl-4">
      <RouterLink :to="card.to" class="fi-card p-4 d-block text-decoration-none stat-card h-100">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <p class="text-secondary small mb-1">{{ card.label }}</p>
            <p class="stat-value mb-0">{{ stats[card.key] }}</p>
          </div>
          <i :class="card.icon" class="fs-4 text-warning" />
        </div>
      </RouterLink>
    </div>
    <div class="col-md-6 col-xl-4">
      <RouterLink to="/datos-empresa" class="fi-card p-4 d-block text-decoration-none stat-card h-100">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <p class="text-secondary small mb-1">Datos de líderes</p>
            <p class="stat-value mb-0">API / Excel</p>
            <p class="small text-secondary mb-0 mt-2">Sube el backoffice o el archivo de cada empresa</p>
          </div>
          <i class="bi bi-cloud-arrow-up fs-4 text-warning" />
        </div>
      </RouterLink>
    </div>
    <div class="col-md-6 col-xl-4">
      <RouterLink to="/reports" class="fi-card p-4 d-block text-decoration-none stat-card h-100">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <p class="text-secondary small mb-1">Reportes de red</p>
            <p class="stat-value mb-0">Abrir</p>
            <p class="small text-secondary mb-0 mt-2">Comisiones, altas, planes y líderes</p>
          </div>
          <i class="bi bi-graph-up fs-4 text-warning" />
        </div>
      </RouterLink>
    </div>
  </div>
</template>
