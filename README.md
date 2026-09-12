# sasadmin

SPA de **administración global** de la plataforma. Mismo stack que sasmlm, otro bundle, otro hostname.

Solo entra quien tiene rol `platform_admin`. El backend vuelve a comprobarlo: esta app no es un muro de seguridad, es UX.

## Mapa de `src`

| Carpeta | Responsabilidad |
| --- | --- |
| `api/` | Cliente `/api/v1/admin/*` + auth. |
| `components/ui/` | Tablas densas, filtros, badges de estado. |
| `components/layout/` | Shell admin. |
| `composables/` | |
| `layouts/` | `AuthLayout`, `AdminLayout`. |
| `router/` | Guard estricto de rol. |
| `stores/` | `auth`. |
| `types/` | |
| `utils/` | |
| `views/auth/` | Login + 2FA (obligatorio). |
| `views/dashboard/` | Métricas globales. |
| `views/users/` | Búsqueda, ficha, suspender. |
| `views/plans/` | CRUD planes. |
| `views/commissions/` | Cola pending / approve / pay / reverse. |
| `views/payments/` | Invoices de plataforma. |
| `views/metrics/` | Si se separa del dashboard. |
| `views/settings/` | Settings globales. |
| `views/audit/` | Activity log. |

## Rutas de UI previstas

| Path | Fase |
| --- | --- |
| `/login` | 1 |
| `/` métricas | 5 |
| `/users`, `/users/:id` | 5 |
| `/plans` | 5 |
| `/commissions` | 5 |
| `/payments` | 5 |
| `/settings` | 5 |
| `/audit` | 5 |

## Qué no va aquí

Editor de landing, árbol genealógico, checkout Stripe del líder. Si un admin necesita “ver como”, se diseña impersonation en Fase 5+ con audit obligatorio; no se reutiliza sasmlm sin traza.
