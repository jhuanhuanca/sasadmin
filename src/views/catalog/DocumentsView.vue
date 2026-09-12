<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { catalog, catalogList } from '@/api/catalog'
import PageHeader from '@/components/PageHeader.vue'
import { useCatalogStore } from '@/stores/catalog'
import { useToast } from '@/composables/useToast'
import { mediaEmbed, mediaPlayer } from '@/utils/mediaPlayback'
import { errorMessage, fieldErrors, pageMeta, unwrapList } from '@/utils/http'

type FileType = 'image' | 'pdf' | 'video' | 'audio'
type Filter = 'all' | FileType

type CatalogDocument = {
  id: number
  title: string
  description?: string | null
  file_path: string
  url?: string
  file_type: FileType
  kind?: string
  player?: string
  embed_url?: string | null
  original_name?: string | null
  thumbnail?: string | null
  sort_order?: number
  is_active?: boolean
}

const catalogStore = useCatalogStore()
const { companyId, currentCompany } = storeToRefs(catalogStore)
const toast = useToast()

const items = ref<CatalogDocument[]>([])
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const errors = ref<Record<string, string[]>>({})
const open = ref(false)
const editing = ref<CatalogDocument | null>(null)
const page = ref(1)
const lastPage = ref(1)
const filter = ref<Filter>('all')

const form = reactive({
  title: '',
  description: '',
  file_type: 'video' as FileType,
  file_path: '',
  thumbnail: '',
  original_name: '',
  sort_order: 0,
  is_active: true,
})

const types: Array<{ value: FileType; label: string; hint: string }> = [
  { value: 'image', label: 'Flyer imagen', hint: 'PNG/JPG o URL de imagen para flyers.' },
  { value: 'pdf', label: 'Flyer PDF', hint: 'PDF para ver o descargar.' },
  { value: 'video', label: 'Video', hint: 'YouTube, Vimeo o URL .mp4 para reproducir aquí.' },
  { value: 'audio', label: 'Audio', hint: 'URL .mp3/.m4a, Spotify, SoundCloud o YouTube para escuchar aquí.' },
]

const previewPlayer = computed(() => mediaPlayer(form.file_type, form.file_path))
const previewEmbed = computed(() => mediaEmbed(form.file_path))

function typeLabel(value: string): string {
  return types.find((item) => item.value === value)?.label ?? value
}

function emptyForm(): void {
  form.title = ''
  form.description = ''
  form.file_type = filter.value === 'all' ? 'video' : filter.value
  form.file_path = ''
  form.thumbnail = ''
  form.original_name = ''
  form.sort_order = 0
  form.is_active = true
}

async function load(): Promise<void> {
  if (!companyId.value) {
    items.value = []
    loading.value = false
    message.value = 'Selecciona una empresa en la barra lateral.'
    return
  }

  loading.value = true
  message.value = ''
  try {
    const query: Record<string, string | number | undefined> = {
      page: page.value,
      per_page: 20,
    }
    if (filter.value !== 'all') {
      query.file_type = filter.value
    }
    const payload = await catalogList<CatalogDocument>(`companies/${companyId.value}/documents`, query)
    items.value = unwrapList(payload)
    lastPage.value = pageMeta(payload).lastPage
  } catch (error) {
    message.value = errorMessage(error, 'No se pudo cargar el material. ¿Está corriendo serv_producmlm?')
  } finally {
    loading.value = false
  }
}

function start(item?: CatalogDocument): void {
  editing.value = item ?? null
  errors.value = {}
  message.value = ''
  if (item) {
    form.title = item.title
    form.description = item.description ?? ''
    form.file_type = item.file_type
    form.file_path = item.url || item.file_path
    form.thumbnail = item.thumbnail ?? ''
    form.original_name = item.original_name ?? ''
    form.sort_order = item.sort_order ?? 0
    form.is_active = item.is_active !== false
  } else {
    emptyForm()
  }
  open.value = true
}

async function submit(): Promise<void> {
  if (!companyId.value) {
    return
  }
  saving.value = true
  errors.value = {}
  try {
    const body = {
      title: form.title,
      description: form.description || null,
      file_type: form.file_type,
      file_path: form.file_path,
      thumbnail: form.thumbnail || null,
      original_name: form.original_name || null,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    }
    if (editing.value) {
      await catalog(`documents/${editing.value.id}`, { method: 'PUT', body })
      toast.success('El material quedó actualizado en el catálogo.', 'Material actualizado')
    } else {
      await catalog(`companies/${companyId.value}/documents`, { method: 'POST', body })
      toast.success('El material ya está en serv_producmlm.', 'Material registrado')
    }
    open.value = false
    await load()
  } catch (error) {
    errors.value = fieldErrors(error)
    message.value = errorMessage(error)
    toast.fromError(error, 'No se pudo guardar el material')
  } finally {
    saving.value = false
  }
}

async function remove(item: CatalogDocument): Promise<void> {
  if (!window.confirm(`¿Eliminar “${item.title}”?`)) {
    return
  }
  try {
    await catalog(`documents/${item.id}`, { method: 'DELETE' })
    await load()
    toast.success('Se quitó del catálogo de la empresa.', 'Material eliminado')
  } catch (error) {
    toast.fromError(error, 'No se pudo eliminar')
  }
}

watch(
  () => [companyId.value, filter.value],
  () => {
    page.value = 1
    void load()
  },
)

onMounted(load)
</script>

<template>
  <PageHeader
    :eyebrow="currentCompany?.name ?? 'Catálogo'"
    title="Videos, flyers y audios"
    hint="Se guarda en serv_producmlm por empresa. Los líderes lo ven en Herramientas. Pega un enlace de YouTube, un PDF o un MP3 para reproducirlo aquí mismo."
  >
    <button class="btn btn-accent" :disabled="!companyId" @click="start()">Nuevo material</button>
  </PageHeader>

  <div v-if="message && !open" class="alert" :class="companyId ? 'alert-danger' : 'alert-warning'">{{ message }}</div>

  <div class="d-flex flex-wrap gap-2 mb-3">
    <button
      v-for="option in [{ value: 'all', label: 'Todo' }, ...types.map((item) => ({ value: item.value, label: item.label }))]"
      :key="option.value"
      type="button"
      class="btn btn-sm"
      :class="filter === option.value ? 'btn-accent' : 'btn-outline-secondary'"
      @click="filter = option.value as Filter"
    >
      {{ option.label }}
    </button>
  </div>

  <div class="fi-card overflow-auto">
    <table class="table fi-table">
      <thead>
        <tr>
          <th>Material</th>
          <th>Tipo</th>
          <th>Enlace</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="5" class="p-4 text-secondary">Cargando…</td></tr>
        <tr v-else-if="!items.length"><td colspan="5" class="p-4 text-secondary">Aún no hay material para esta empresa.</td></tr>
        <tr v-for="item in items" :key="item.id">
          <td>
            <div class="fw-semibold">{{ item.title }}</div>
            <div v-if="item.description" class="small text-secondary">{{ item.description }}</div>
          </td>
          <td>{{ typeLabel(item.file_type) }}</td>
          <td class="small text-break" style="max-width: 280px">{{ item.url || item.file_path }}</td>
          <td>{{ item.is_active === false ? 'Oculto' : 'Activo' }}</td>
          <td class="text-end text-nowrap">
            <button class="btn btn-sm btn-outline-dark me-2" @click="start(item)">Editar</button>
            <button class="btn btn-sm btn-outline-danger" @click="remove(item)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="lastPage > 1" class="d-flex justify-content-end mt-3">
    <div class="btn-group">
      <button class="btn btn-sm btn-outline-secondary" :disabled="page <= 1" @click="page -= 1; load()">Anterior</button>
      <button class="btn btn-sm btn-outline-secondary" disabled>{{ page }} / {{ lastPage }}</button>
      <button class="btn btn-sm btn-outline-secondary" :disabled="page >= lastPage" @click="page += 1; load()">Siguiente</button>
    </div>
  </div>

  <div v-if="open" class="modal-mask" @click.self="open = false">
    <div class="fi-card p-4" style="width: min(720px, 100%); max-height: 90vh; overflow: auto">
      <h3 class="h5 mb-3">{{ editing ? 'Editar material' : 'Registrar material' }}</h3>
      <div v-if="message" class="alert alert-danger">{{ message }}</div>
      <form class="d-grid gap-3" @submit.prevent="submit">
        <div>
          <label class="form-label">Título</label>
          <input v-model="form.title" class="form-control" required maxlength="255" />
          <div v-if="errors.title" class="form-text text-danger">{{ errors.title[0] }}</div>
        </div>
        <div>
          <label class="form-label">Tipo</label>
          <select v-model="form.file_type" class="form-select" required>
            <option v-for="type in types" :key="type.value" :value="type.value">{{ type.label }}</option>
          </select>
          <p class="form-text mb-0">{{ types.find((item) => item.value === form.file_type)?.hint }}</p>
        </div>
        <div>
          <label class="form-label">Enlace o URL del archivo</label>
          <input v-model="form.file_path" class="form-control" required placeholder="https://…" />
          <div v-if="errors.file_path" class="form-text text-danger">{{ errors.file_path[0] }}</div>
        </div>
        <div>
          <label class="form-label">Descripción</label>
          <textarea v-model="form.description" class="form-control" rows="2" />
        </div>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Miniatura (opcional)</label>
            <input v-model="form.thumbnail" class="form-control" placeholder="https://…" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Nombre de archivo</label>
            <input v-model="form.original_name" class="form-control" />
          </div>
          <div class="col-md-2">
            <label class="form-label">Orden</label>
            <input v-model.number="form.sort_order" type="number" min="0" class="form-control" />
          </div>
        </div>
        <label class="form-check">
          <input v-model="form.is_active" type="checkbox" class="form-check-input" />
          <span class="form-check-label">Visible para líderes</span>
        </label>

        <div v-if="form.file_path" class="border rounded-3 p-3 bg-light">
          <p class="small text-secondary mb-2">Vista previa</p>
          <img v-if="previewPlayer === 'image'" :src="form.thumbnail || form.file_path" alt="" class="img-fluid rounded" />
          <iframe
            v-else-if="previewPlayer === 'pdf'"
            :src="form.file_path"
            class="w-100 bg-white rounded"
            style="height: 280px"
            title="PDF"
          />
          <iframe
            v-else-if="previewPlayer === 'iframe' && previewEmbed"
            :src="previewEmbed"
            class="w-100 rounded"
            style="height: 280px"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            title="Reproductor"
          />
          <video v-else-if="previewPlayer === 'video'" :src="form.file_path" class="w-100 rounded" controls />
          <audio v-else-if="previewPlayer === 'audio'" :src="form.file_path" class="w-100" controls />
          <p v-else class="small mb-0">
            Abre el enlace para revisarlo:
            <a :href="form.file_path" target="_blank" rel="noreferrer">{{ form.file_path }}</a>
          </p>
        </div>

        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-secondary" @click="open = false">Cancelar</button>
          <button class="btn btn-accent" :disabled="saving">Guardar en catálogo</button>
        </div>
      </form>
    </div>
  </div>
</template>
