export const CATALOG_TOOL_KEYS = [
  'wellness',
  'imc',
  'wellness_consult',
  'flyers',
  'pdfs',
  'videos',
  'audios',
  'ring_sizer',
] as const

export type CatalogToolKey = (typeof CATALOG_TOOL_KEYS)[number]

export type CatalogToolOption = {
  key: CatalogToolKey
  label: string
  hint: string
}

export const CATALOG_TOOL_OPTIONS: CatalogToolOption[] = [
  { key: 'wellness', label: 'Bienestar y salud', hint: 'Protocolos por dolencia' },
  { key: 'imc', label: 'Calculadora IMC', hint: 'Paquetes de peso' },
  { key: 'wellness_consult', label: 'Consulta personalizada', hint: 'Cuestionario de hábitos' },
  { key: 'flyers', label: 'Flyers', hint: 'Imágenes descargables' },
  { key: 'pdfs', label: 'PDFs', hint: 'Documentos' },
  { key: 'videos', label: 'Videos', hint: 'Material audiovisual' },
  { key: 'audios', label: 'Audios', hint: 'Audios para compartir' },
  { key: 'ring_sizer', label: 'Medidor de anillos', hint: 'Talla hombre/mujer y prueba AR' },
]
