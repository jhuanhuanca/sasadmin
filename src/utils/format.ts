export function roleNames(user: { roles?: Array<string | { name: string }> } | null | undefined): string[] {
  return (user?.roles ?? []).map((role) => (typeof role === 'string' ? role : role.name))
}

export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Admin',
    leader: 'Líder',
    partner: 'Socio',
  }

  return labels[role] ?? role
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Activo',
    invited: 'Invitado',
    suspended: 'Suspendido',
    closed: 'Cerrado',
    pending: 'Pendiente',
    approved: 'Aprobada',
    paid: 'Pagada',
    reversed: 'Revertida',
    requested: 'Solicitada',
    rejected: 'Rechazada',
    open: 'Abierto',
    in_progress: 'En atención',
    landing: 'Web pública',
    platform: 'Plataforma',
  }

  return labels[status] ?? status
}

export function money(value: number | string | null | undefined, currency = 'USD'): string {
  const amount = Number(value ?? 0)
  const key = String(currency || 'USD').toUpperCase()

  try {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: key,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${key}`
  }
}

export function initials(name?: string | null): string {
  return (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
