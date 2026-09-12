<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { createUser, fetchUser, updateUser } from '@/api/admin'
import PageHeader from '@/components/PageHeader.vue'
import { roleNames } from '@/utils/format'
import { useToast } from '@/composables/useToast'
import { errorMessage, fieldErrors } from '@/utils/http'

const route = useRoute()
const router = useRouter()
const id = computed(() => {
  const value = Number(route.params.id)
  return Number.isFinite(value) && value > 0 ? value : null
})

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'partner',
  status: 'active',
})
const affiliation = reactive({
  country: '',
  companyId: null as number | null,
  companyName: '',
  rankName: '',
  companies: [] as Array<{
    catalog_company_id: number
    catalog_company_name?: string | null
    is_primary?: boolean
  }>,
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
    const user = await fetchUser(id.value)
    form.name = user.name
    form.email = user.email
    form.status = user.status
    form.role = roleNames(user)[0] ?? 'partner'
    affiliation.country = user.country ?? ''
    affiliation.companyId = user.catalog_company_id ?? null
    affiliation.companyName = user.catalog_company_name ?? ''
    affiliation.rankName = user.catalog_rank_name ?? ''
    affiliation.companies = user.companies ?? []
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo cargar el usuario')
  } finally {
    loading.value = false
  }
})

async function submit(): Promise<void> {
  saving.value = true
  errors.value = {}
  message.value = ''

  try {
    if (id.value) {
      const body: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
        status: form.status,
      }
      if (form.password) {
        body.password = form.password
        body.password_confirmation = form.password_confirmation
      }
      await updateUser(id.value, body)
    } else {
      await createUser({ ...form })
    }

    await router.push({ name: form.role === 'partner' ? 'partners' : 'users' })
    toast.success(
      id.value ? `${form.name} quedó actualizado.` : `${form.name} se creó en la plataforma.`,
      id.value ? 'Usuario actualizado' : 'Usuario creado',
    )
  } catch (error) {
    errors.value = fieldErrors(error)
    message.value = errorMessage(error)
    toast.fromError(error, 'No se pudo guardar el usuario')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <PageHeader
    eyebrow="Red"
    :title="id ? 'Editar usuario' : 'Nuevo usuario'"
    hint="Los socios y líderes entran a sasmlm; el admin entra aquí."
  >
    <RouterLink to="/users" class="btn btn-outline-secondary">Volver</RouterLink>
  </PageHeader>

  <div v-if="loading" class="text-secondary">Cargando…</div>
  <form v-else class="fi-card p-4" style="max-width: 720px" @submit.prevent="submit">
    <div v-if="message" class="alert alert-danger">{{ message }}</div>
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Nombre</label>
        <input v-model="form.name" class="form-control" required />
        <div v-if="errors.name" class="form-text text-danger">{{ errors.name[0] }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Correo</label>
        <input v-model="form.email" type="email" class="form-control" required />
        <div v-if="errors.email" class="form-text text-danger">{{ errors.email[0] }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label">{{ id ? 'Nueva contraseña (opcional)' : 'Contraseña' }}</label>
        <input v-model="form.password" type="password" class="form-control" :required="!id" />
        <div v-if="errors.password" class="form-text text-danger">{{ errors.password[0] }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Confirmar contraseña</label>
        <input v-model="form.password_confirmation" type="password" class="form-control" :required="!id || Boolean(form.password)" />
      </div>
      <div class="col-md-6">
        <label class="form-label">Rol</label>
        <select v-model="form.role" class="form-select">
          <option value="partner">Socio</option>
          <option value="leader">Líder</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Estado</label>
        <select v-model="form.status" class="form-select">
          <option value="active">Activo</option>
          <option value="invited">Invitado</option>
          <option value="suspended">Suspendido</option>
          <option value="closed">Cerrado</option>
        </select>
      </div>
    </div>
    <div v-if="id" class="mt-4 pt-3 border-top">
      <p class="fw-semibold mb-1">Empresa registrada</p>
      <p class="small text-secondary mb-3">Afiliación al catálogo al momento del registro. Los socios heredan la empresa de su líder.</p>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Empresa</label>
          <div class="form-control-plaintext">
            <template v-if="affiliation.companies.length">
              <div v-for="company in affiliation.companies" :key="company.catalog_company_id">
                <RouterLink :to="`/catalog/companies/${company.catalog_company_id}`">
                  {{ company.catalog_company_name || `Empresa #${company.catalog_company_id}` }}
                </RouterLink>
                <span v-if="company.is_primary && affiliation.companies.length > 1" class="text-secondary small"> (principal)</span>
              </div>
            </template>
            <RouterLink v-else-if="affiliation.companyId" :to="`/catalog/companies/${affiliation.companyId}`">
              {{ affiliation.companyName || `Empresa #${affiliation.companyId}` }}
            </RouterLink>
            <span v-else class="text-secondary">Sin empresa</span>
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label">Rango</label>
          <div class="form-control-plaintext">{{ affiliation.rankName || '—' }}</div>
        </div>
        <div class="col-md-3">
          <label class="form-label">País</label>
          <div class="form-control-plaintext">{{ affiliation.country || '—' }}</div>
        </div>
      </div>
    </div>
    <button class="btn btn-accent mt-4" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
  </form>
</template>
