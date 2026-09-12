import type { AdminUser, AdminReportOverview, Commission, Organization, Plan, SupportTicket, WithdrawalRequest } from '@/types'
import type { Paginated } from '@/utils/http'
import { api } from '@/api/client'
import { unwrapList } from '@/utils/http'

export function fetchUsers(query: Record<string, string | number | undefined> = {}) {
  return api<Paginated<AdminUser>>('/admin/users', { query })
}

export function fetchUser(id: number) {
  return api<AdminUser>(`/admin/users/${id}`)
}

export function createUser(body: Record<string, unknown>) {
  return api<AdminUser>('/admin/users', { method: 'POST', body })
}

export function updateUser(id: number, body: Record<string, unknown>) {
  return api<AdminUser>(`/admin/users/${id}`, { method: 'PUT', body })
}

export function deleteUser(id: number) {
  return api(`/admin/users/${id}`, { method: 'DELETE' })
}

export async function fetchPlans(): Promise<Plan[]> {
  const payload = await api<Plan[] | { data: Plan[] }>('/admin/plans')
  return unwrapList(payload as { data: Plan[] })
}

export function createPlan(body: Record<string, unknown>) {
  return api<Plan>('/admin/plans', { method: 'POST', body })
}

export function updatePlan(id: number, body: Record<string, unknown>) {
  return api<Plan>(`/admin/plans/${id}`, { method: 'PUT', body })
}

export function deletePlan(id: number) {
  return api(`/admin/plans/${id}`, { method: 'DELETE' })
}

export function fetchCommissions(query: Record<string, string | number | undefined> = {}) {
  return api<Paginated<Commission>>('/admin/commissions', { query })
}

export function payCommission(id: number) {
  return api<Commission>(`/admin/commissions/${id}/pay`, { method: 'POST' })
}

export function cancelCommission(id: number) {
  return api<Commission>(`/admin/commissions/${id}/cancel`, { method: 'POST' })
}

export function fetchWithdrawals(query: Record<string, string | number | undefined> = {}) {
  return api<Paginated<WithdrawalRequest>>('/admin/withdrawals', { query })
}

export function payWithdrawal(id: number) {
  return api<WithdrawalRequest>(`/admin/withdrawals/${id}/pay`, { method: 'POST' })
}

export function rejectWithdrawal(id: number, notes?: string) {
  return api<WithdrawalRequest>(`/admin/withdrawals/${id}/reject`, {
    method: 'POST',
    body: notes ? { notes } : {},
  })
}

export function fetchReportsOverview(query: Record<string, string | number | undefined> = {}) {
  return api<AdminReportOverview>('/admin/reports/overview', { query })
}

export async function fetchOrganizations(): Promise<Organization[]> {
  const payload = await api<Organization[] | { data: Organization[] }>('/admin/organizations')
  return unwrapList(payload as { data: Organization[] })
}

export function fetchOrganization(id: number) {
  return api<Organization | { data: Organization }>(`/admin/organizations/${id}`)
}

export function createOrganization(body: { name: string; catalog_company_id?: number | null }) {
  return api<Organization | { data: Organization }>('/admin/organizations', { method: 'POST', body })
}

export function saveOrganizationConnection(
  orgId: number,
  body: Record<string, unknown>,
  file?: File | null,
) {
  if (file) {
    const form = new FormData()
    form.append('driver', String(body.driver ?? ''))
    if (body.name) {
      form.append('name', String(body.name))
    }
    if (body.id) {
      form.append('id', String(body.id))
    }
    const config = (body.config ?? {}) as Record<string, unknown>
    Object.entries(config).forEach(([key, value]) => {
      if (value != null && value !== '') {
        form.append(`config[${key}]`, String(value))
      }
    })
    const credentials = (body.credentials ?? {}) as Record<string, unknown>
    Object.entries(credentials).forEach(([key, value]) => {
      if (value != null && value !== '') {
        form.append(`credentials[${key}]`, String(value))
      }
    })
    form.append('file', file)
    return api(`/admin/organizations/${orgId}/connections`, { method: 'POST', body: form })
  }

  return api(`/admin/organizations/${orgId}/connections`, { method: 'POST', body })
}

export function syncOrganizationConnection(orgId: number, connectionId: number) {
  return api(`/admin/organizations/${orgId}/connections/${connectionId}/sync`, { method: 'POST' })
}

export function deleteOrganizationConnection(orgId: number, connectionId: number) {
  return api(`/admin/organizations/${orgId}/connections/${connectionId}`, { method: 'DELETE' })
}

export function saveOrganizationMetricsProfile(orgId: number, body: Record<string, unknown>) {
  return api(`/admin/organizations/${orgId}/metrics-profile`, { method: 'PUT', body })
}

export function fetchSupportTickets(query: Record<string, string | number | undefined> = {}) {
  return api<Paginated<SupportTicket>>('/admin/support/tickets', { query })
}

export function fetchSupportTicket(id: number) {
  return api<SupportTicket | { data: SupportTicket }>(`/admin/support/tickets/${id}`)
}

export function updateSupportTicket(id: number, status: SupportTicket['status']) {
  return api<SupportTicket | { data: SupportTicket }>(`/admin/support/tickets/${id}`, {
    method: 'PUT',
    body: { status },
  })
}

export function replySupportTicket(id: number, message: string) {
  return api<SupportTicket | { data: SupportTicket }>(`/admin/support/tickets/${id}/replies`, {
    method: 'POST',
    body: { message },
  })
}
