<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  deleteOrganizationConnection,
  fetchOrganization,
  saveOrganizationConnection,
  saveOrganizationMetricsProfile,
  syncOrganizationConnection,
} from '@/api/admin'
import PageHeader from '@/components/PageHeader.vue'
import type { Organization, OrganizationConnection, OrganizationMetricsProfile } from '@/types'
import { useToast } from '@/composables/useToast'
import { errorMessage, unwrapData } from '@/utils/http'

const route = useRoute()
const id = computed(() => Number(route.params.id))
const organization = ref<Organization | null>(null)
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const apiForm = reactive({ base_url: '', health_path: '', token: '' })
const otherForm = reactive({ url: '', notes: '' })
const excelFile = ref<File | null>(null)
const otherFile = ref<File | null>(null)
const excelPeriod = ref(currentPeriod())
const notice = ref('')
const toast = useToast()
const profile = reactive<OrganizationMetricsProfile>({
  published: false,
  volume_unit: 'PV',
  derive_personal_from_items: false,
  derive_group_from_downline: false,
  group_includes_personal: true,
  group_depth: null,
  min_personal: null,
  min_group: null,
  qualified_lines: null,
  line_min_volume: null,
  maintenance: false,
  ranks: [],
})

const connections = computed(() => organization.value?.connections ?? [])

function currentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function byDriver(driver: string): OrganizationConnection | undefined {
  return connections.value.find((item) => item.driver === driver)
}

function statusLabel(status?: string): string {
  if (status === 'connected') {
    return 'Conectada'
  }
  if (status === 'error') {
    return 'Error'
  }
  if (status === 'disabled') {
    return 'Desactivada'
  }
  return 'Sin sincronizar'
}

async function load(): Promise<void> {
  loading.value = true
  message.value = ''
  try {
    organization.value = unwrapData(await fetchOrganization(id.value))
    const next = organization.value.metrics_profile
    if (next) {
      Object.assign(profile, next)
      profile.ranks = [...(next.ranks ?? [])]
    }
    const api = byDriver('api')
    apiForm.base_url = api?.config?.base_url ?? ''
    apiForm.health_path = api?.config?.health_path ?? ''
    const other = byDriver('other')
    otherForm.url = other?.config?.url ?? ''
    otherForm.notes = other?.config?.notes ?? ''
    excelPeriod.value = byDriver('excel')?.config?.period || currentPeriod()
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo cargar la organización')
  } finally {
    loading.value = false
  }
}

async function save(driver: string, extra: Record<string, unknown> = {}, file?: File | null): Promise<void> {
  saving.value = true
  message.value = ''
  notice.value = ''
  try {
    const existing = byDriver(driver)
    await saveOrganizationConnection(
      id.value,
      {
        id: existing?.id,
        driver,
        ...extra,
      },
      file,
    )
    await load()
    const connection = byDriver(driver)
    if (connection?.last_error) {
      message.value = connection.last_error
      toast.error(connection.last_error, 'Conexión con error')
    } else {
      notice.value =
        connection?.latest_sync?.message ||
        'Datos guardados. En el cierre, cada líder ve solo su red; no un padrón global.'
      toast.success(notice.value, 'Conexión guardada')
    }
    if (driver === 'excel') {
      excelFile.value = null
    }
    if (driver === 'other') {
      otherFile.value = null
    }
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo guardar la conexión')
    toast.fromError(error, 'No se pudo guardar la conexión')
  } finally {
    saving.value = false
  }
}

async function sync(connection: OrganizationConnection): Promise<void> {
  saving.value = true
  message.value = ''
  notice.value = ''
  try {
    await syncOrganizationConnection(id.value, connection.id)
    await load()
    const fresh = connections.value.find((item) => item.id === connection.id)
    if (fresh?.last_error) {
      message.value = fresh.last_error
      toast.error(fresh.last_error, 'Sincronización con error')
    } else {
      notice.value = fresh?.latest_sync?.message || 'Sincronización lista.'
      toast.success(notice.value, 'Sincronización lista')
    }
  } catch (error) {
    message.value = errorMessage(error, 'Falló la sincronización')
    toast.fromError(error, 'Falló la sincronización')
  } finally {
    saving.value = false
  }
}

async function remove(connection: OrganizationConnection): Promise<void> {
  if (!window.confirm(`¿Quitar ${connection.name}?`)) {
    return
  }
  try {
    await deleteOrganizationConnection(id.value, connection.id)
    await load()
    toast.success(`${connection.name} se quitó de la organización.`, 'Conexión eliminada')
  } catch (error) {
    toast.fromError(error, 'No se pudo quitar la conexión')
  }
}

async function saveProfile(): Promise<void> {
  saving.value = true
  message.value = ''
  try {
    await saveOrganizationMetricsProfile(id.value, {
      ...profile,
      min_personal: numberOrNull(profile.min_personal),
      min_group: numberOrNull(profile.min_group),
      qualified_lines: numberOrNull(profile.qualified_lines),
      line_min_volume: numberOrNull(profile.line_min_volume),
      group_depth: numberOrNull(profile.group_depth),
      ranks: profile.ranks
        .filter((rank) => rank.name.trim() !== '')
        .map((rank, index) => ({
          ...rank,
          min_personal: numberOrNull(rank.min_personal),
          min_group: numberOrNull(rank.min_group),
          min_lines: numberOrNull(rank.min_lines),
          sort_order: index + 1,
        })),
    })
    await load()
    toast.success('Rangos y umbrales de volumen quedaron guardados.', 'Perfil de métricas')
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo guardar el perfil de métricas')
    toast.fromError(error, 'No se pudo guardar el perfil de métricas')
  } finally {
    saving.value = false
  }
}

function addRank(): void {
  profile.ranks.push({
    name: '',
    min_personal: null,
    min_group: null,
    min_lines: null,
    sort_order: profile.ranks.length + 1,
  })
}

function removeRank(index: number): void {
  profile.ranks.splice(index, 1)
}

function numberOrNull(value: unknown): number | null {
  if (value === '' || value === null || value === undefined || Number.isNaN(Number(value))) {
    return null
  }
  return Number(value)
}

onMounted(load)
</script>

<template>
  <PageHeader
    :title="organization ? `Datos de líderes · ${organization.name}` : 'Datos de líderes'"
    eyebrow="API, Excel y archivos"
    hint="Este es el dato oficial de la empresa. Sube la API del backoffice, un Excel/CSV del padrón de líderes, u otro archivo. Cada líder cierra solo su red; aquí no mezclas marcas."
  >
    <RouterLink to="/datos-empresa" class="btn btn-outline-secondary">Todas las empresas</RouterLink>
  </PageHeader>

  <div v-if="notice" class="alert alert-success">{{ notice }}</div>
  <div v-if="message" class="alert alert-danger">{{ message }}</div>
  <div v-if="loading && !organization" class="text-secondary">Cargando…</div>

  <template v-if="organization">
    <p class="text-secondary mb-4">
      {{ organization.members_count ?? 0 }} miembros · zona {{ organization.default_timezone }}
      · catálogo #{{ organization.catalog_company_id ?? '—' }}
    </p>

    <div class="row g-3">
      <div class="col-lg-6">
        <section class="fi-card p-3 h-100">
          <div class="d-flex justify-content-between gap-2">
            <h2 class="h5 mb-0">Catálogo</h2>
            <span class="badge text-bg-light">{{ statusLabel(byDriver('catalog')?.status) }}</span>
          </div>
          <p class="small text-secondary mt-2">serv_producmlm: productos, rangos y plan de compensación.</p>
          <button class="btn btn-accent btn-sm" :disabled="saving" @click="save('catalog')">Sincronizar catálogo</button>
        </section>
      </div>

      <div class="col-lg-6">
        <section class="fi-card p-3 h-100">
          <div class="d-flex justify-content-between gap-2">
            <h2 class="h5 mb-0">API</h2>
            <span class="badge text-bg-light">{{ statusLabel(byDriver('api')?.status) }}</span>
          </div>
          <p class="small text-secondary mt-2">
            URL y token del backoffice de esta marca. No lo pone el líder: lo cargas tú.
          </p>
          <label class="form-label mt-2">URL base</label>
          <input v-model="apiForm.base_url" class="form-control mb-2" placeholder="https://backoffice.empresa.com/api" />
          <label class="form-label">Ruta de salud (opcional)</label>
          <input v-model="apiForm.health_path" class="form-control mb-2" placeholder="health" />
          <label class="form-label">Token</label>
          <input v-model="apiForm.token" class="form-control mb-2" type="password" :placeholder="byDriver('api')?.has_token ? 'Token guardado' : 'Bearer token'" />
          <button
            class="btn btn-dark btn-sm"
            :disabled="saving"
            @click="save('api', { config: { base_url: apiForm.base_url, health_path: apiForm.health_path }, credentials: { token: apiForm.token || undefined } })"
          >
            Probar y guardar
          </button>
        </section>
      </div>

      <div class="col-lg-6">
        <section class="fi-card p-3 h-100">
          <div class="d-flex justify-content-between gap-2">
            <h2 class="h5 mb-0">Excel / CSV</h2>
            <span class="badge text-bg-light">{{ statusLabel(byDriver('excel')?.status) }}</span>
          </div>
          <p class="small text-secondary mt-2">
            Exportación de la empresa con el padrón de líderes (código, email, patrocinador, PV/GV, periodo).
            No es el Excel personal que un líder sube en sasmlm.
          </p>
          <p class="small text-secondary">
            Columnas típicas: <code>codigo</code>, <code>email</code>, <code>nombre</code>, <code>patrocinador</code>,
            <code>pv</code>, <code>gv</code>, <code>periodo</code>. DXN puede traer SV/CV; Omnilife, puntos.
          </p>
          <label class="form-label">Periodo del archivo</label>
          <input v-model="excelPeriod" class="form-control mb-2" type="month" />
          <p v-if="byDriver('excel')?.config?.file_name" class="small text-secondary">
            Último archivo: {{ byDriver('excel')?.config?.file_name }}
          </p>
          <input class="form-control mb-2" type="file" accept=".csv,.tsv,.txt,.xlsx" @change="excelFile = ($event.target as HTMLInputElement).files?.[0] ?? null" />
          <button
            class="btn btn-dark btn-sm"
            :disabled="saving || !excelFile"
            @click="save('excel', { config: { period: excelPeriod } }, excelFile)"
          >
            Importar archivo de líderes
          </button>
        </section>
      </div>

      <div class="col-lg-6">
        <section class="fi-card p-3 h-100">
          <div class="d-flex justify-content-between gap-2">
            <h2 class="h5 mb-0">Otro medio</h2>
            <span class="badge text-bg-light">{{ statusLabel(byDriver('other')?.status) }}</span>
          </div>
          <p class="small text-secondary mt-2">PDF, ZIP, JSON, enlace FTP u otro dump que te entregue la empresa.</p>
          <input v-model="otherForm.url" class="form-control mb-2" placeholder="URL, FTP, carpeta compartida…" />
          <textarea v-model="otherForm.notes" class="form-control mb-2" rows="2" placeholder="Cómo se obtiene el dato" />
          <input class="form-control mb-2" type="file" @change="otherFile = ($event.target as HTMLInputElement).files?.[0] ?? null" />
          <button
            class="btn btn-dark btn-sm"
            :disabled="saving"
            @click="save('other', { config: { url: otherForm.url, notes: otherForm.notes } }, otherFile)"
          >
            Registrar medio
          </button>
        </section>
      </div>
    </div>

    <section class="fi-card overflow-auto mt-4">
      <div class="p-3 border-bottom">
        <h2 class="h5 mb-0">Conexiones</h2>
      </div>
      <table class="table fi-table mb-0">
        <thead>
          <tr>
            <th>Medio</th>
            <th>Estado</th>
            <th>Última sync</th>
            <th>Registros</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!connections.length">
            <td colspan="5" class="p-4 text-secondary">Aún no hay conexiones.</td>
          </tr>
          <tr v-for="item in connections" :key="item.id">
            <td>
              <div class="fw-semibold">{{ item.name }}</div>
              <div class="small text-secondary">{{ item.driver }}</div>
              <div v-if="item.last_error" class="small text-danger">{{ item.last_error }}</div>
            </td>
            <td>{{ statusLabel(item.status) }}</td>
            <td>{{ item.last_synced_at ? new Date(item.last_synced_at).toLocaleString('es') : '—' }}</td>
            <td>
              <span v-for="source in item.sources ?? []" :key="source.kind" class="d-block small">
                {{ source.label }}: {{ source.last_count }}
              </span>
            </td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-dark me-1" :disabled="saving" @click="sync(item)">Sync</button>
              <button class="btn btn-sm btn-outline-danger" @click="remove(item)">Quitar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="fi-card p-3 mt-4">
      <h2 class="h5 mb-2">Reglas de calificación (plano B)</h2>
      <p class="small text-secondary">
        Hasta que publiques, el cierre del líder no afirma “calificaste / no calificaste”.
        La suma de downline como GV solo ocurre si lo activas. No hay código por marca: sirve para HGW, DXN, Face Global u Omnilife.
      </p>
      <div class="form-check mb-3">
        <input id="published" v-model="profile.published" class="form-check-input" type="checkbox" />
        <label class="form-check-label" for="published">Publicar reglas (oficial para el cierre)</label>
      </div>
      <div class="row g-3">
        <div class="col-md-3">
          <label class="form-label">Unidad</label>
          <input v-model="profile.volume_unit" class="form-control" placeholder="PV o puntos" />
        </div>
        <div class="col-md-3">
          <label class="form-label">PV / puntos mínimo personal</label>
          <input v-model.number="profile.min_personal" class="form-control" type="number" min="0" />
        </div>
        <div class="col-md-3">
          <label class="form-label">GV / grupo mínimo</label>
          <input v-model.number="profile.min_group" class="form-control" type="number" min="0" />
        </div>
        <div class="col-md-3">
          <label class="form-label">Líneas calificadas</label>
          <input v-model.number="profile.qualified_lines" class="form-control" type="number" min="0" />
        </div>
        <div class="col-md-3">
          <label class="form-label">Volumen mínimo por línea</label>
          <input v-model.number="profile.line_min_volume" class="form-control" type="number" min="0" />
        </div>
        <div class="col-md-3">
          <label class="form-label">Profundidad de grupo</label>
          <input v-model.number="profile.group_depth" class="form-control" type="number" min="1" placeholder="vacío = toda la red" />
        </div>
      </div>
      <div class="d-flex flex-wrap gap-3 mt-3">
        <label class="form-check">
          <input v-model="profile.derive_personal_from_items" class="form-check-input" type="checkbox" />
          <span class="form-check-label">Derivar PV de ítems × catálogo si no vino importado</span>
        </label>
        <label class="form-check">
          <input v-model="profile.derive_group_from_downline" class="form-check-input" type="checkbox" />
          <span class="form-check-label">Derivar GV como suma de la downline</span>
        </label>
        <label class="form-check">
          <input v-model="profile.group_includes_personal" class="form-check-input" type="checkbox" />
          <span class="form-check-label">El GV incluye el volumen personal</span>
        </label>
        <label class="form-check">
          <input v-model="profile.maintenance" class="form-check-input" type="checkbox" />
          <span class="form-check-label">Exige pedido de mantenimiento</span>
        </label>
      </div>
      <div class="mt-4">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h3 class="h6 mb-0">Umbrales de rango</h3>
          <button class="btn btn-sm btn-outline-dark" type="button" @click="addRank">Añadir rango</button>
        </div>
        <div v-for="(rank, index) in profile.ranks" :key="index" class="row g-2 align-items-end mb-2">
          <div class="col-md-3">
            <input v-model="rank.name" class="form-control" placeholder="Nombre (Star, Plata…)" />
          </div>
          <div class="col-md-2">
            <input v-model.number="rank.min_personal" class="form-control" type="number" min="0" placeholder="PV mín." />
          </div>
          <div class="col-md-2">
            <input v-model.number="rank.min_group" class="form-control" type="number" min="0" placeholder="GV mín." />
          </div>
          <div class="col-md-2">
            <input v-model.number="rank.min_lines" class="form-control" type="number" min="0" placeholder="Líneas" />
          </div>
          <div class="col-md-2">
            <button class="btn btn-sm btn-outline-danger" type="button" @click="removeRank(index)">Quitar</button>
          </div>
        </div>
      </div>
      <button class="btn btn-dark btn-sm mt-3" :disabled="saving" type="button" @click="saveProfile">
        Guardar reglas
      </button>
    </section>
  </template>
</template>
