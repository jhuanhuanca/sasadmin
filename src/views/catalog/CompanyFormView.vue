<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { catalog } from '@/api/catalog'
import ColorCodeField from '@/components/ColorCodeField.vue'
import PageHeader from '@/components/PageHeader.vue'
import { CATALOG_TOOL_KEYS, CATALOG_TOOL_OPTIONS } from '@/data/catalogTools'
import type { Company } from '@/types'
import { errorMessage, fieldErrors, unwrapData } from '@/utils/http'
import { useCatalogStore } from '@/stores/catalog'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()
const id = computed(() => {
  const value = Number(route.params.id)
  return Number.isFinite(value) && value > 0 ? value : null
})

const form = reactive({
  name: '',
  logo: '',
  website: '',
  is_active: true,
  primary: '#ffd452',
  secondary: '#252525',
  accent: '#f7f5ed',
  enabled_tools: [...CATALOG_TOOL_KEYS] as string[],
})
const errors = ref<Record<string, string[]>>({})
const message = ref('')
const loading = ref(Boolean(id.value))
const saving = ref(false)
const toast = useToast()

onMounted(async () => {
  if (!id.value) {
    return
  }

  try {
    const company = unwrapData(await catalog<Company | { data: Company }>(`companies/${id.value}`))
    form.name = company.name
    form.logo = company.logo ?? ''
    form.website = company.website ?? ''
    form.is_active = company.is_active
    form.primary = company.color_palette?.primary ?? '#ffd452'
    form.secondary = company.color_palette?.secondary ?? '#252525'
    form.accent = company.color_palette?.accent ?? '#f7f5ed'
    const tools = Array.isArray(company.enabled_tools) ? company.enabled_tools : [...CATALOG_TOOL_KEYS]
    form.enabled_tools = tools.filter((key) => CATALOG_TOOL_KEYS.includes(key as (typeof CATALOG_TOOL_KEYS)[number]))
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo cargar la empresa')
  } finally {
    loading.value = false
  }
})

async function submit(): Promise<void> {
  saving.value = true
  errors.value = {}
  message.value = ''

  const body = {
    name: form.name,
    logo: form.logo || null,
    website: form.website || null,
    is_active: form.is_active,
    color_palette: {
      primary: form.primary,
      secondary: form.secondary,
      accent: form.accent,
    },
    enabled_tools: form.enabled_tools,
  }

  try {
    if (id.value) {
      await catalog(`companies/${id.value}`, { method: 'PUT', body })
    } else {
      await catalog('companies', { method: 'POST', body })
    }
    await catalogStore.loadCompanies()
    toast.success(
      id.value ? `${form.name} quedó actualizada.` : `${form.name} se dio de alta en el catálogo.`,
      id.value ? 'Empresa actualizada' : 'Empresa creada',
    )
    await router.push({ name: 'companies' })
  } catch (error) {
    errors.value = fieldErrors(error)
    message.value = errorMessage(error)
    toast.fromError(error, 'No se pudo guardar la empresa')
  } finally {
    saving.value = false
  }
}

function toolChecked(key: string): boolean {
  return form.enabled_tools.includes(key)
}

function toggleTool(key: string, checked: boolean): void {
  if (checked) {
    if (!form.enabled_tools.includes(key)) {
      form.enabled_tools = [...form.enabled_tools, key]
    }
    return
  }

  form.enabled_tools = form.enabled_tools.filter((item) => item !== key)
}
</script>

<template>
  <PageHeader eyebrow="Catálogo" :title="id ? 'Editar empresa' : 'Nueva empresa'">
    <RouterLink to="/catalog/companies" class="btn btn-outline-secondary">Volver</RouterLink>
  </PageHeader>

  <div v-if="loading" class="text-secondary">Cargando…</div>
  <form v-else class="fi-card p-4" style="max-width: 720px" @submit.prevent="submit">
    <div v-if="message" class="alert alert-danger">{{ message }}</div>
    <div class="row g-3">
      <div class="col-12">
        <label class="form-label">Nombre</label>
        <input v-model="form.name" class="form-control" required />
        <div v-if="errors.name" class="form-text text-danger">{{ errors.name[0] }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Logo (URL)</label>
        <input v-model="form.logo" class="form-control" />
      </div>
      <div class="col-md-6">
        <label class="form-label">Sitio web</label>
        <input v-model="form.website" type="url" class="form-control" />
      </div>
      <div class="col-md-4">
        <ColorCodeField v-model="form.primary" label="Color principal" />
      </div>
      <div class="col-md-4">
        <ColorCodeField v-model="form.secondary" label="Color secundario" />
      </div>
      <div class="col-md-4">
        <ColorCodeField v-model="form.accent" label="Acento / fondo" />
      </div>
      <div class="col-12">
        <label class="form-check">
          <input v-model="form.is_active" type="checkbox" class="form-check-input" />
          <span class="form-check-label">Empresa activa</span>
        </label>
      </div>
      <div class="col-12">
        <p class="form-label mb-1">Herramientas visibles en el panel del líder</p>
        <p class="small text-secondary mb-3">
          Desmarca las que esta marca no usa. El resto de empresas no cambia.
        </p>
        <div class="d-flex flex-wrap gap-2 mb-2">
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="form.enabled_tools = [...CATALOG_TOOL_KEYS]">
            Todas
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="form.enabled_tools = []">
            Ninguna
          </button>
        </div>
        <div class="row g-2">
          <div v-for="tool in CATALOG_TOOL_OPTIONS" :key="tool.key" class="col-md-6">
            <label class="form-check border rounded-3 p-3 h-100">
              <input
                class="form-check-input"
                type="checkbox"
                :checked="toolChecked(tool.key)"
                @change="toggleTool(tool.key, ($event.target as HTMLInputElement).checked)"
              />
              <span class="form-check-label">
                <span class="d-block fw-semibold">{{ tool.label }}</span>
                <span class="small text-secondary">{{ tool.hint }}</span>
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
    <button class="btn btn-accent mt-4" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
  </form>
</template>
