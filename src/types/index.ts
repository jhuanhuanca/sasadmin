export type RoleName = 'admin' | 'leader' | 'partner'

export interface AuthUser {
  id: number
  name: string
  email: string
  status: string
  roles: RoleName[] | Array<{ name: RoleName }>
  current_network_id: number | null
  two_factor_enabled?: boolean
}

export interface AuthPayload {
  user: AuthUser
  token: string
  two_factor_status?: 'ok' | 'setup' | 'challenge'
  recovery_codes?: string[]
}

export interface AdminUser {
  id: number
  name: string
  email: string
  status: string
  country?: string | null
  catalog_company_id?: number | null
  catalog_company_name?: string | null
  catalog_rank_id?: number | null
  catalog_rank_name?: string | null
  organization_id?: number | null
  companies?: Array<{
    catalog_company_id: number
    catalog_company_name?: string | null
    catalog_rank_id?: number | null
    catalog_rank_name?: string | null
    is_primary?: boolean
  }>
  roles?: Array<{ id: number; name: string }>
  referrals_count?: number
  created_at?: string
  store?: { id: number; name: string; slug: string } | null
  landing_page?: { id: number; slug: string; title: string } | null
  referrals?: Array<{ id: number }>
}

export interface Plan {
  id: number
  name: string
  slug: string
  price: number | string
  currency: string
  interval: string
  commission_percentage: number | string
  features?: string[] | null
  is_active: boolean
  paddle_price_id?: string | null
  paddle_intro_discount_id?: string | null
  intro_price?: number | string
  stripe_price_id?: string | null
}

export interface Commission {
  id: number
  amount: number | string
  status: string
  paid_at?: string | null
  created_at?: string
  referrer?: { id: number; name: string; email: string } | null
  referred?: { id: number; name: string; email: string } | null
}

export interface WithdrawalRequest {
  id: number
  user_id: number
  amount: number | string
  currency: string
  status: string
  collect_all?: boolean
  whatsapp?: string | null
  contact_email?: string | null
  notes?: string | null
  paid_at?: string | null
  processed_at?: string | null
  created_at?: string
  user?: { id: number; name: string; email: string } | null
  processed_by?: { id: number; name: string } | null
}

export interface Company {
  id: number
  name: string
  slug: string
  logo?: string | null
  website?: string | null
  is_active: boolean
  products_count?: number
  color_palette?: {
    primary?: string
    secondary?: string
    accent?: string
  } | null
}

export interface Category {
  id: number
  company_id?: number
  name: string
  slug?: string
}

export interface Product {
  id: number
  company_id: number
  category_id?: number | null
  code: string
  name: string
  image?: string | null
  description?: string | null
  technical_sheet?: string | null
  price: number | string
  currency?: string
  is_active: boolean
  countries?: string[]
  company?: Company | null
  category?: Category | null
}

export interface CatalogItem {
  id: number
  [key: string]: unknown
}

export interface OrganizationMetricsProfile {
  published: boolean
  volume_unit: string
  derive_personal_from_items: boolean
  derive_group_from_downline: boolean
  group_includes_personal: boolean
  group_depth?: number | null
  min_personal?: number | null
  min_group?: number | null
  qualified_lines?: number | null
  line_min_volume?: number | null
  maintenance: boolean
  ranks: Array<{
    code?: string | null
    name: string
    min_personal?: number | null
    min_group?: number | null
    min_lines?: number | null
    sort_order?: number
  }>
}

export interface Organization {
  id: number
  name: string
  slug: string
  catalog_company_id?: number | null
  default_timezone: string
  default_currency: string
  status: string
  members_count?: number
  metrics_profile?: OrganizationMetricsProfile
  connections?: OrganizationConnection[]
  connector?: {
    connected: boolean
    last_synced_at?: string | null
    drivers?: string[]
  }
}

export interface OrganizationConnection {
  id: number
  organization_id: number
  network_id?: number | null
  scope: string
  driver: 'api' | 'excel' | 'catalog' | 'other' | string
  name: string
  status: string
  config?: {
    base_url?: string | null
    health_path?: string | null
    url?: string | null
    notes?: string | null
    period?: string | null
    file_name?: string | null
    has_file?: boolean
  }
  has_token?: boolean
  last_synced_at?: string | null
  last_error?: string | null
  sources?: Array<{ kind: string; label: string; last_count: number }>
  latest_sync?: {
    id: number
    status: string
    records?: Record<string, number> | null
    message?: string | null
    finished_at?: string | null
  } | null
}

export type ReportGroup = 'day' | 'month' | 'year'

export interface ReportPerson {
  id?: number
  user_id?: number
  name?: string | null
  email?: string | null
}

export interface AdminReportOverview {
  from: string
  to: string
  group: ReportGroup | string
  generated_at: string
  totals: {
    users_new: number
    leaders_new: number
    partners_new: number
    commissions_generated_count: number
    commissions_generated_amount: number
    commissions_paid_count: number
    commissions_paid_amount: number
    commissions_pending_amount: number
    plan_sales_count: number
  }
  series: Array<{
    period: string
    users_new: number
    leaders_new: number
    partners_new: number
    commissions_generated: number
    commissions_paid: number
    plan_sales: number
  }>
  commissions_by_user: Array<{
    user_id: number
    name: string
    email: string
    generated_count: number
    generated_amount: number
    paid_amount: number
    pending_amount: number
  }>
  paid_commissions: Array<{
    id: number
    amount: number
    currency: string
    paid_at?: string | null
    referrer?: ReportPerson | null
    referred?: ReportPerson | null
  }>
  plan_sales: Array<{
    plan_name: string
    sales: number
    revenue: number
  }>
  top_companies: Array<{
    company_id: number | null
    name: string
    users: number
    users_in_period: number
  }>
  top_leaders: Array<{
    user_id: number
    name: string
    email: string
    partners: number
    partners_in_period: number
  }>
}

export interface SupportTicketReply {
  id: number
  author_role: 'user' | 'admin'
  author_name: string
  message: string
  created_at: string
}

export interface SupportTicket {
  id: number
  source: 'landing' | 'platform'
  status: 'open' | 'in_progress' | 'closed'
  name: string
  email: string
  subject: string
  message: string
  user_id: number | null
  catalog_company_id: number | null
  replies?: SupportTicketReply[]
  created_at: string
  updated_at: string
}
