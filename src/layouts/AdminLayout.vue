<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useCatalogStore } from '@/stores/catalog'
import { initials } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const catalog = useCatalogStore()
const toast = useToast()
const { user } = storeToRefs(auth)
const { companies, companyId } = storeToRefs(catalog)
const open = ref(false)

const links = [
  { group: 'Panel', items: [{ to: '/', name: 'dashboard', icon: 'bi-speedometer2', label: 'Dashboard' }] },
  {
    group: 'Datos de empresa',
    items: [
      { to: '/datos-empresa', name: 'company-data', icon: 'bi-cloud-arrow-up', label: 'API, Excel y archivos' },
    ],
  },
  {
    group: 'Red',
    items: [
      { to: '/users', name: 'users', icon: 'bi-people', label: 'Usuarios' },
      { to: '/partners', name: 'partners', icon: 'bi-person-hearts', label: 'Socios' },
      { to: '/plans', name: 'plans', icon: 'bi-credit-card', label: 'Planes' },
      { to: '/commissions', name: 'commissions', icon: 'bi-cash-stack', label: 'Comisiones' },
      { to: '/withdrawals', name: 'withdrawals', icon: 'bi-wallet2', label: 'Retiros' },
      { to: '/reports', name: 'reports', icon: 'bi-graph-up', label: 'Reportes' },
      { to: '/tickets', name: 'tickets', icon: 'bi-life-preserver', label: 'Soporte' },
      { to: '/organizations', name: 'organizations', icon: 'bi-diagram-3', label: 'Organizaciones' },
    ],
  },
  {
    group: 'Catálogo',
    items: [
      { to: '/catalog/companies', name: 'companies', icon: 'bi-buildings', label: 'Empresas' },
      { to: '/catalog/ranks', name: 'ranks', icon: 'bi-award', label: 'Rangos' },
      { to: '/catalog/products', name: 'products', icon: 'bi-box-seam', label: 'Productos' },
      { to: '/catalog/categories', name: 'categories', icon: 'bi-tags', label: 'Categorías' },
      { to: '/catalog/documents', name: 'documents', icon: 'bi-collection-play', label: 'Videos, flyers y audios' },
      { to: '/catalog/compensation', name: 'compensation', icon: 'bi-diagram-3', label: 'Plan de compensación' },
      { to: '/catalog/wellness', name: 'wellness', icon: 'bi-heart-pulse', label: 'Bienestar' },
      { to: '/catalog/imc', name: 'imc', icon: 'bi-calculator', label: 'Paquetes IMC' },
      { to: '/catalog/starter', name: 'starter', icon: 'bi-box2-heart', label: 'Paquetes de inicio' },
      { to: '/catalog/stars', name: 'stars', icon: 'bi-star', label: 'Productos estrella' },
      { to: '/catalog/fundamentals', name: 'fundamentals', icon: 'bi-calendar-week', label: '5 días' },
    ],
  },
]

const title = computed(() => {
  const current = links.flatMap((group) => group.items).find((item) => isActive(item.name))
  return current?.label ?? 'Admin'
})

function isActive(name: string): boolean {
  if (name === 'dashboard') {
    return route.name === 'dashboard'
  }

  if (name === 'users') {
    return String(route.name).startsWith('users') && route.name !== 'partners'
  }

  if (name === 'company-data') {
    return route.name === 'company-data' || route.name === 'organizations-show'
  }

  if (name === 'organizations') {
    return route.name === 'organizations'
  }

  if (name === 'companies') {
    return String(route.name).startsWith('companies')
  }

  if (name === 'products') {
    return String(route.name).startsWith('products')
  }

  return route.name === name
}

function onCompanyChange(event: Event): void {
  const target = event.target
  if (target instanceof HTMLSelectElement) {
    catalog.setCompany(target.value ? Number(target.value) : null)
  }
}

async function logout(): Promise<void> {
  await auth.logout()
  toast.info('Cerraste sesión de administración.', 'Sesión cerrada')
  await router.push({ name: 'login' })
}

onMounted(() => {
  void catalog.loadCompanies().catch(() => undefined)
})
</script>

<template>
  <div class="admin-shell d-flex">
    <aside class="admin-sidebar d-flex flex-column p-3 d-print-none" :class="{ 'is-open': open }">
      <RouterLink to="/" class="admin-brand d-flex align-items-center gap-2 px-2 py-2 mb-3" @click="open = false">
        <span class="rounded-3 bg-warning text-dark px-2 py-1 fw-bold">RX</span>
        REXmlm Admin
      </RouterLink>

      <nav class="flex-grow-1 overflow-auto">
        <div v-for="group in links" :key="group.group">
          <p class="admin-nav-label">{{ group.group }}</p>
          <RouterLink
            v-for="item in group.items"
            :key="item.name"
            :to="item.to"
            :class="{ 'is-active': isActive(item.name) }"
            @click="open = false"
          >
            <i :class="item.icon" />
            {{ item.label }}
          </RouterLink>
        </div>
      </nav>

      <div class="mt-3">
        <label class="form-label text-white-50 small mb-1">Empresa del catálogo</label>
        <select class="form-select form-select-sm company-chip" :value="companyId ?? ''" @change="onCompanyChange">
          <option value="">Selecciona empresa</option>
          <option v-for="company in companies" :key="company.id" :value="company.id">{{ company.name }}</option>
        </select>
      </div>
    </aside>

    <div class="admin-main flex-grow-1 min-w-0 d-flex flex-column">
      <header class="admin-topbar px-3 px-lg-4 py-3 d-flex align-items-center gap-3 d-print-none">
        <button type="button" class="btn btn-light sidebar-toggle" @click="open = !open">
          <i class="bi bi-list" />
        </button>
        <div class="min-w-0">
          <p class="text-uppercase small text-secondary mb-0" style="letter-spacing: 0.14em">Administración</p>
          <h1 class="h5 mb-0">{{ title }}</h1>
        </div>
        <div class="ms-auto d-flex align-items-center gap-2">
          <span class="d-none d-md-inline small text-secondary">{{ user?.email }}</span>
          <span class="badge rounded-circle text-bg-dark" style="width: 36px; height: 36px; place-items: center; display: grid">
            {{ initials(user?.name) }}
          </span>
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="logout">Salir</button>
        </div>
      </header>
      <main class="admin-content flex-grow-1 p-3 p-lg-4">
        <RouterView />
      </main>
    </div>
  </div>
</template>
