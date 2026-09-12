export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'url' | 'items' | 'list'

export type ResourceField = {
  key: string
  label: string
  type: FieldType
  required?: boolean
  options?: Array<{ value: string; label: string }>
}

export type CatalogResource = {
  id: string
  title: string
  hint: string
  companyScoped: boolean
  listPath: (companyId: number | null) => string
  itemPath: (id: number) => string
  fields: ResourceField[]
  columns: Array<{ key: string; label: string }>
}

export const catalogResources: Record<string, CatalogResource> = {
  ranks: {
    id: 'ranks',
    title: 'Rangos',
    hint: 'Rangos de la empresa. El líder los elige al registrarse.',
    companyScoped: true,
    listPath: (companyId) => `companies/${companyId}/ranks`,
    itemPath: (id) => `ranks/${id}`,
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'requirements', label: 'Requisitos', type: 'textarea' },
      { key: 'example', label: 'Ejemplo', type: 'textarea' },
      { key: 'sort_order', label: 'Orden', type: 'number' },
    ],
    columns: [
      { key: 'name', label: 'Rango' },
      { key: 'requirements', label: 'Requisitos' },
      { key: 'sort_order', label: 'Orden' },
    ],
  },
  categories: {
    id: 'categories',
    title: 'Categorías',
    hint: 'Agrupan los productos del catálogo.',
    companyScoped: true,
    listPath: () => 'categories',
    itemPath: (id) => `categories/${id}`,
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text' },
    ],
    columns: [
      { key: 'name', label: 'Nombre' },
      { key: 'slug', label: 'Slug' },
    ],
  },
  documents: {
    id: 'documents',
    title: 'Videos, flyers y audios',
    hint: 'Se guarda en serv_producmlm. Videos, flyers PDF/imagen y audios reproducibles.',
    companyScoped: true,
    listPath: (companyId) => `companies/${companyId}/documents`,
    itemPath: (id) => `documents/${id}`,
    fields: [
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'file_path', label: 'URL o enlace', type: 'text', required: true },
      {
        key: 'file_type',
        label: 'Tipo',
        type: 'select',
        required: true,
        options: [
          { value: 'pdf', label: 'Flyer PDF' },
          { value: 'image', label: 'Flyer imagen' },
          { value: 'video', label: 'Video' },
          { value: 'audio', label: 'Audio' },
        ],
      },
      { key: 'original_name', label: 'Nombre original', type: 'text' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'thumbnail', label: 'Miniatura', type: 'text' },
      { key: 'sort_order', label: 'Orden', type: 'number' },
      { key: 'is_active', label: 'Activo', type: 'checkbox' },
    ],
    columns: [
      { key: 'title', label: 'Título' },
      { key: 'file_type', label: 'Tipo' },
      { key: 'file_path', label: 'Archivo' },
    ],
  },
  wellness: {
    id: 'wellness',
    title: 'Necesidades de bienestar',
    hint: 'Protocolos y productos recomendados.',
    companyScoped: true,
    listPath: (companyId) => `companies/${companyId}/wellness-needs`,
    itemPath: (id) => `wellness-needs/${id}`,
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'image', label: 'Imagen', type: 'url' },
      { key: 'sort_order', label: 'Orden', type: 'number' },
      { key: 'items', label: 'Productos', type: 'items' },
    ],
    columns: [
      { key: 'name', label: 'Nombre' },
      { key: 'sort_order', label: 'Orden' },
    ],
  },
  imc: {
    id: 'imc',
    title: 'Paquetes IMC',
    hint: 'Kits para bajar o subir de peso.',
    companyScoped: true,
    listPath: (companyId) => `companies/${companyId}/imc-packages`,
    itemPath: (id) => `imc-packages/${id}`,
    fields: [
      {
        key: 'goal',
        label: 'Objetivo',
        type: 'select',
        required: true,
        options: [
          { value: 'lose_weight', label: 'Bajar de peso' },
          { value: 'gain_weight', label: 'Subir de peso' },
        ],
      },
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'image', label: 'Imagen', type: 'url' },
      { key: 'sort_order', label: 'Orden', type: 'number' },
      { key: 'items', label: 'Productos', type: 'items' },
    ],
    columns: [
      { key: 'name', label: 'Nombre' },
      { key: 'goal', label: 'Objetivo' },
      { key: 'items', label: 'Productos' },
    ],
  },
  starter: {
    id: 'starter',
    title: 'Paquetes de inicio',
    hint: 'Kits de arranque de la empresa: título, descripción, costo, beneficios e imagen.',
    companyScoped: true,
    listPath: (companyId) => `companies/${companyId}/starter-packages`,
    itemPath: (id) => `starter-packages/${id}`,
    fields: [
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'price', label: 'Costo', type: 'number', required: true },
      { key: 'benefits', label: 'Beneficios (uno por línea)', type: 'list' },
      { key: 'image', label: 'Imagen (URL)', type: 'text' },
      { key: 'sort_order', label: 'Orden', type: 'number' },
      { key: 'is_active', label: 'Activo', type: 'checkbox' },
    ],
    columns: [
      { key: 'title', label: 'Título' },
      { key: 'price', label: 'Costo' },
      { key: 'benefits', label: 'Beneficios' },
    ],
  },
  stars: {
    id: 'stars',
    title: 'Productos estrella',
    hint: 'Destacados de la empresa.',
    companyScoped: true,
    listPath: (companyId) => `companies/${companyId}/star-products`,
    itemPath: (id) => `star-products/${id}`,
    fields: [
      { key: 'product_id', label: 'Producto', type: 'select', required: true },
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'sort_order', label: 'Orden', type: 'number' },
    ],
    columns: [
      { key: 'title', label: 'Título' },
      { key: 'product_id', label: 'Producto' },
    ],
  },
  fundamentals: {
    id: 'fundamentals',
    title: 'Fundamentos 5 días',
    hint: 'Contenido del programa de cinco días.',
    companyScoped: true,
    listPath: (companyId) => `companies/${companyId}/five-day-fundamentals`,
    itemPath: (id) => `five-day-fundamentals/${id}`,
    fields: [
      { key: 'day_number', label: 'Día', type: 'number' },
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'sort_order', label: 'Orden', type: 'number' },
    ],
    columns: [
      { key: 'day_number', label: 'Día' },
      { key: 'title', label: 'Título' },
    ],
  },
}

export function getResource(id: string): CatalogResource {
  const resource = catalogResources[id]
  if (!resource) {
    throw new Error(`Recurso de catálogo desconocido: ${id}`)
  }

  return resource
}
