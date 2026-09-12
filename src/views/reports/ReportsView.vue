<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchReportsOverview } from '@/api/admin'
import PageHeader from '@/components/PageHeader.vue'
import type { AdminReportOverview, ReportGroup } from '@/types'
import { money } from '@/utils/format'
import { errorMessage } from '@/utils/http'

function isoDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const from = ref(isoDate(new Date(new Date().getFullYear(), 0, 1)))
const to = ref(isoDate(new Date()))
const group = ref<ReportGroup>('month')
const report = ref<AdminReportOverview | null>(null)
const loading = ref(true)
const message = ref('')

const groupLabels: Record<ReportGroup, string> = {
  day: 'Día',
  month: 'Mes',
  year: 'Año',
}

const kpis = computed(() => {
  const totals = report.value?.totals
  if (!totals) {
    return []
  }

  return [
    { label: 'Personas nuevas', value: String(totals.users_new) },
    { label: 'Líderes nuevos', value: String(totals.leaders_new) },
    { label: 'Socios nuevos', value: String(totals.partners_new) },
    { label: 'Comisiones generadas', value: money(totals.commissions_generated_amount) },
    { label: 'Comisiones pagadas', value: money(totals.commissions_paid_amount) },
    { label: 'Pendientes del rango', value: money(totals.commissions_pending_amount) },
    { label: 'Ventas de planes', value: String(totals.plan_sales_count) },
  ]
})

function periodLabel(period: string): string {
  if (group.value === 'year') {
    return period
  }

  if (group.value === 'day') {
    return new Date(`${period}T00:00:00`).toLocaleDateString('es')
  }

  const [year, month] = period.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('es', {
    month: 'long',
    year: 'numeric',
  })
}

function groupLabel(value: string): string {
  return groupLabels[value as ReportGroup] ?? value
}

function formatWhen(value?: string | null): string {
  if (!value) {
    return '—'
  }

  return new Date(value).toLocaleString('es')
}

async function load(): Promise<void> {
  loading.value = true
  message.value = ''
  try {
    report.value = await fetchReportsOverview({
      from: from.value,
      to: to.value,
      group: group.value,
    })
  } catch (error) {
    message.value = errorMessage(error, 'No se pudieron cargar los reportes')
  } finally {
    loading.value = false
  }
}

function printPdf(): void {
  window.print()
}

onMounted(load)
</script>

<template>
  <div class="reports-page">
    <div class="d-print-none">
      <PageHeader
        eyebrow="Red"
        title="Reportes"
        hint="Comisiones, altas de personas, ventas de planes, empresas y líderes con más socios. Usa Imprimir PDF y elige Guardar como PDF."
      >
        <button type="button" class="btn btn-accent" :disabled="!report" @click="printPdf">
          Imprimir PDF
        </button>
      </PageHeader>
    </div>

    <div class="fi-card p-3 mb-3 d-print-none">
      <div class="row g-2 align-items-end">
        <div class="col-md-3">
          <label class="form-label">Desde</label>
          <input v-model="from" class="form-control" type="date" />
        </div>
        <div class="col-md-3">
          <label class="form-label">Hasta</label>
          <input v-model="to" class="form-control" type="date" />
        </div>
        <div class="col-md-3">
          <label class="form-label">Agrupar por</label>
          <select v-model="group" class="form-select">
            <option value="day">Día</option>
            <option value="month">Mes</option>
            <option value="year">Año</option>
          </select>
        </div>
        <div class="col-md-3">
          <button class="btn btn-dark w-100" @click="load">Actualizar</button>
        </div>
      </div>
    </div>

    <div v-if="message" class="alert alert-danger d-print-none">{{ message }}</div>
    <div v-if="loading" class="text-secondary d-print-none">Cargando reportes…</div>

    <div v-else-if="report" class="report-print">
      <div class="d-none d-print-block mb-4">
        <h1 class="h4 mb-1">REXmlm · Reportes de red</h1>
        <p class="mb-0">
          Del {{ report.from }} al {{ report.to }} · agrupado por {{ groupLabel(report.group) }}
        </p>
      </div>

      <div class="row g-3 mb-4">
        <div v-for="card in kpis" :key="card.label" class="col-6 col-xl-4">
          <div class="fi-card p-3 h-100">
            <p class="text-secondary small mb-1">{{ card.label }}</p>
            <p class="stat-value mb-0">{{ card.value }}</p>
          </div>
        </div>
      </div>

      <section class="fi-card overflow-auto mb-4">
        <div class="p-3 border-bottom">
          <h2 class="h5 mb-0">Ingresos y actividad por {{ groupLabels[group].toLowerCase() }}</h2>
        </div>
        <table class="table fi-table mb-0">
          <thead>
            <tr>
              <th>Periodo</th>
              <th>Personas</th>
              <th>Líderes</th>
              <th>Socios</th>
              <th>Comisiones generadas</th>
              <th>Comisiones pagadas</th>
              <th>Planes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!report.series.length">
              <td colspan="7" class="p-4 text-secondary">Sin movimientos en el rango.</td>
            </tr>
            <tr v-for="row in report.series" :key="row.period">
              <td class="text-capitalize">{{ periodLabel(row.period) }}</td>
              <td>{{ row.users_new }}</td>
              <td>{{ row.leaders_new }}</td>
              <td>{{ row.partners_new }}</td>
              <td>{{ money(row.commissions_generated) }}</td>
              <td>{{ money(row.commissions_paid) }}</td>
              <td>{{ row.plan_sales }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="fi-card overflow-auto mb-4">
        <div class="p-3 border-bottom">
          <h2 class="h5 mb-0">Comisiones pagadas</h2>
          <p class="small text-secondary mb-0">
            {{ report.totals.commissions_paid_count }} pagos · {{ money(report.totals.commissions_paid_amount) }}
          </p>
        </div>
        <table class="table fi-table mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Líder</th>
              <th>Origen</th>
              <th>Monto</th>
              <th>Pagada</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!report.paid_commissions.length">
              <td colspan="5" class="p-4 text-secondary">No hay comisiones pagadas en este rango.</td>
            </tr>
            <tr v-for="item in report.paid_commissions" :key="item.id">
              <td>#{{ item.id }}</td>
              <td>
                <div>{{ item.referrer?.name ?? '—' }}</div>
                <div class="small text-secondary">{{ item.referrer?.email }}</div>
              </td>
              <td>{{ item.referred?.name ?? '—' }}</td>
              <td>{{ money(item.amount, item.currency) }}</td>
              <td>{{ formatWhen(item.paid_at) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="fi-card overflow-auto mb-4">
        <div class="p-3 border-bottom">
          <h2 class="h5 mb-0">Comisiones generadas por usuario</h2>
        </div>
        <table class="table fi-table mb-0">
          <thead>
            <tr>
              <th>Líder</th>
              <th>Generadas</th>
              <th>Pagadas</th>
              <th>Pendientes</th>
              <th>Movimientos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!report.commissions_by_user.length">
              <td colspan="5" class="p-4 text-secondary">Nadie generó comisiones en este rango.</td>
            </tr>
            <tr v-for="item in report.commissions_by_user" :key="item.user_id">
              <td>
                <div class="fw-semibold">{{ item.name }}</div>
                <div class="small text-secondary">{{ item.email }}</div>
              </td>
              <td>{{ money(item.generated_amount) }}</td>
              <td>{{ money(item.paid_amount) }}</td>
              <td>{{ money(item.pending_amount) }}</td>
              <td>{{ item.generated_count }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div class="row g-3 mb-4">
        <div class="col-lg-6">
          <section class="fi-card overflow-auto h-100">
            <div class="p-3 border-bottom">
              <h2 class="h5 mb-0">Venta de planes</h2>
            </div>
            <table class="table fi-table mb-0">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Ventas</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!report.plan_sales.length">
                  <td colspan="3" class="p-4 text-secondary">Sin ventas de plan en el rango.</td>
                </tr>
                <tr v-for="item in report.plan_sales" :key="item.plan_name">
                  <td>{{ item.plan_name }}</td>
                  <td>{{ item.sales }}</td>
                  <td>{{ money(item.revenue) }}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
        <div class="col-lg-6">
          <section class="fi-card overflow-auto h-100">
            <div class="p-3 border-bottom">
              <h2 class="h5 mb-0">Empresas más adquiridas</h2>
            </div>
            <table class="table fi-table mb-0">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Socios totales</th>
                  <th>Nuevos en el rango</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!report.top_companies.length">
                  <td colspan="3" class="p-4 text-secondary">Nadie tiene empresa asignada.</td>
                </tr>
                <tr v-for="item in report.top_companies" :key="String(item.company_id ?? item.name)">
                  <td>{{ item.name }}</td>
                  <td>{{ item.users }}</td>
                  <td>{{ item.users_in_period }}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>

      <section class="fi-card overflow-auto mb-4">
        <div class="p-3 border-bottom">
          <h2 class="h5 mb-0">Líderes con más socios</h2>
        </div>
        <table class="table fi-table mb-0">
          <thead>
            <tr>
              <th>Líder</th>
              <th>Socios totales</th>
              <th>Nuevos en el rango</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!report.top_leaders.length">
              <td colspan="3" class="p-4 text-secondary">Aún no hay líderes con socios.</td>
            </tr>
            <tr v-for="item in report.top_leaders" :key="item.user_id">
              <td>
                <div class="fw-semibold">{{ item.name }}</div>
                <div class="small text-secondary">{{ item.email }}</div>
              </td>
              <td>{{ item.partners }}</td>
              <td>{{ item.partners_in_period }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>
