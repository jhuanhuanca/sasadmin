import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { catalogList } from '@/api/catalog'
import type { Company, Product } from '@/types'
import { unwrapList } from '@/utils/http'

const COMPANY_KEY = 'rexmlm.admin.company'

export const useCatalogStore = defineStore('catalog', () => {
  const companies = ref<Company[]>([])
  const products = ref<Product[]>([])
  const companyId = ref<number | null>(Number(localStorage.getItem(COMPANY_KEY)) || null)
  const loaded = ref(false)

  const currentCompany = computed(() => companies.value.find((item) => item.id === companyId.value) ?? null)

  async function loadCompanies(): Promise<void> {
    const payload = await catalogList<Company>('companies')
    companies.value = unwrapList(payload)
    loaded.value = true

    if (companyId.value && !companies.value.some((item) => item.id === companyId.value)) {
      companyId.value = companies.value[0]?.id ?? null
    }

    if (!companyId.value && companies.value[0]) {
      setCompany(companies.value[0].id)
    }
  }

  async function loadProducts(): Promise<void> {
    if (!companyId.value) {
      products.value = []
      return
    }

    const payload = await catalogList<Product>('products', { company_id: companyId.value, per_page: 100 })
    products.value = unwrapList(payload)
  }

  function setCompany(id: number | null): void {
    companyId.value = id
    if (id) {
      localStorage.setItem(COMPANY_KEY, String(id))
    } else {
      localStorage.removeItem(COMPANY_KEY)
    }
  }

  return { companies, products, companyId, loaded, currentCompany, loadCompanies, loadProducts, setCompany }
})
