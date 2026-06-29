import type { User } from '@supabase/supabase-js'

export type AdminRole = 'admin' | 'viewer'

export type AdminResource =
  | 'site_settings'
  | 'support_settings'
  | 'about_sections'
  | 'hero_slides'
  | 'popup_notices'
  | 'conductor'
  | 'accompanist'
  | 'members'
  | 'concerts'
  | 'notices'
  | 'gallery'
  | 'videos'
  | 'posters'
  | 'history'
  | 'locations'
  | 'join_info'
  | 'contacts'
  | 'support_pledges'
  | 'sponsors'
  | 'account'

export interface AdminProfile {
  id: string
  email: string | null
  role: AdminRole
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  profile: AdminProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isSupabaseConfigured: boolean
  error: string | null
}

export type AdminRouteState =
  | 'checking'
  | 'setup-required'
  | 'unauthenticated'
  | 'forbidden'
  | 'authorized'

export interface AdminNavigationItem {
  href: string
  label: string
  resource: AdminResource
}

export interface AdminTableColumn<TRecord> {
  header: string
  key: keyof TRecord
  width?: string
}

export interface AdminFormState<TValue> {
  data: TValue
  error: string | null
  isDirty: boolean
  isSubmitting: boolean
}
