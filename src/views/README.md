# Vistas sasadmin

Todas las rutas (salvo auth) exigen rol `platform_admin` en el router **y** en la API.

| Carpeta | Fase | Contenido previsto |
| --- | --- | --- |
| `auth/` | 1 | Login + 2FA |
| `dashboard/` | 5 | Métricas globales |
| `users/` | 5 | Listado y ficha |
| `plans/` | 5 | CRUD |
| `commissions/` | 5 | Cola de pago |
| `payments/` | 5 | Invoices plataforma |
| `metrics/` | 5 | Detalle si se separa del dashboard |
| `settings/` | 5 | Config global |
| `audit/` | 5 | Activity log |
