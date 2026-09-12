import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/login/2fa',
    name: '2fa-challenge',
    component: () => import('@/views/auth/TwoFactorChallengeView.vue'),
    meta: { twoFactor: 'challenge' },
  },
  {
    path: '/login/2fa-setup',
    name: '2fa-setup',
    component: () => import('@/views/auth/TwoFactorSetupView.vue'),
    meta: { twoFactor: 'setup' },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('@/views/dashboard/DashboardView.vue') },
      { path: 'users', name: 'users', component: () => import('@/views/users/UsersView.vue') },
      { path: 'users/new', name: 'users-new', component: () => import('@/views/users/UserFormView.vue') },
      { path: 'users/:id', name: 'users-edit', component: () => import('@/views/users/UserFormView.vue') },
      {
        path: 'partners',
        name: 'partners',
        component: () => import('@/views/users/UsersView.vue'),
        meta: { role: 'partner', title: 'Socios' },
      },
      { path: 'plans', name: 'plans', component: () => import('@/views/plans/PlansView.vue') },
      { path: 'tickets', name: 'tickets', component: () => import('@/views/support/TicketsView.vue') },
      { path: 'commissions', name: 'commissions', component: () => import('@/views/commissions/CommissionsView.vue') },
      { path: 'withdrawals', name: 'withdrawals', component: () => import('@/views/withdrawals/WithdrawalsView.vue') },
      { path: 'reports', name: 'reports', component: () => import('@/views/reports/ReportsView.vue') },
      { path: 'datos-empresa', name: 'company-data', component: () => import('@/views/organizations/CompanyDataHubView.vue') },
      { path: 'organizations', name: 'organizations', component: () => import('@/views/organizations/OrganizationsView.vue') },
      { path: 'organizations/:id', name: 'organizations-show', component: () => import('@/views/organizations/OrganizationDetailView.vue') },
      { path: 'catalog/companies', name: 'companies', component: () => import('@/views/catalog/CompaniesView.vue') },
      { path: 'catalog/companies/new', name: 'companies-new', component: () => import('@/views/catalog/CompanyFormView.vue') },
      { path: 'catalog/companies/:id', name: 'companies-edit', component: () => import('@/views/catalog/CompanyFormView.vue') },
      { path: 'catalog/ranks', name: 'ranks', component: () => import('@/views/catalog/CatalogResourceView.vue'), meta: { resource: 'ranks' } },
      { path: 'catalog/products', name: 'products', component: () => import('@/views/catalog/ProductsView.vue') },
      { path: 'catalog/products/new', name: 'products-new', component: () => import('@/views/catalog/ProductFormView.vue') },
      { path: 'catalog/products/:id', name: 'products-edit', component: () => import('@/views/catalog/ProductFormView.vue') },
      { path: 'catalog/categories', name: 'categories', component: () => import('@/views/catalog/CatalogResourceView.vue'), meta: { resource: 'categories' } },
      { path: 'catalog/documents', name: 'documents', component: () => import('@/views/catalog/DocumentsView.vue') },
      { path: 'catalog/compensation', name: 'compensation', component: () => import('@/views/catalog/CompensationView.vue') },
      { path: 'catalog/wellness', name: 'wellness', component: () => import('@/views/catalog/CatalogResourceView.vue'), meta: { resource: 'wellness' } },
      { path: 'catalog/imc', name: 'imc', component: () => import('@/views/catalog/CatalogResourceView.vue'), meta: { resource: 'imc' } },
      { path: 'catalog/starter', name: 'starter', component: () => import('@/views/catalog/CatalogResourceView.vue'), meta: { resource: 'starter' } },
      { path: 'catalog/stars', name: 'stars', component: () => import('@/views/catalog/CatalogResourceView.vue'), meta: { resource: 'stars' } },
      { path: 'catalog/fundamentals', name: 'fundamentals', component: () => import('@/views/catalog/CatalogResourceView.vue'), meta: { resource: 'fundamentals' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.booted) {
    await auth.hydrate()
  }

  if (to.meta.twoFactor) {
    if (auth.pendingTwoFactor !== to.meta.twoFactor) {
      return { name: 'login' }
    }
    return true
  }

  if (auth.pendingTwoFactor) {
    return { name: auth.pendingTwoFactor === 'setup' ? '2fa-setup' : '2fa-challenge' }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})
