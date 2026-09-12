export type CatalogCountry = {
  code: string
  name: string
}

export const CATALOG_COUNTRIES: CatalogCountry[] = [
  { code: 'VE', name: 'Venezuela' },
  { code: 'CO', name: 'Colombia' },
  { code: 'MX', name: 'México' },
  { code: 'PE', name: 'Perú' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'CL', name: 'Chile' },
  { code: 'AR', name: 'Argentina' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'BR', name: 'Brasil' },
  { code: 'PA', name: 'Panamá' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'HN', name: 'Honduras' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'DO', name: 'República Dominicana' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'CU', name: 'Cuba' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'ES', name: 'España' },
  { code: 'IT', name: 'Italia' },
  { code: 'PT', name: 'Portugal' },
  { code: 'XX', name: 'Otro' },
]

const names = Object.fromEntries(CATALOG_COUNTRIES.map((country) => [country.code, country.name]))

export function countryLabel(code: string | null | undefined): string {
  if (!code) {
    return '—'
  }

  return names[code] ?? code
}

export function countriesLabel(codes: string[] | null | undefined): string {
  if (!codes?.length) {
    return 'Todos'
  }

  return codes.map((code) => countryLabel(code)).join(', ')
}
