import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getHomePreviewAuthOptions } from './homePreviewMode'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient | null = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: getHomePreviewAuthOptions(typeof window === 'undefined' ? undefined : {
        pathname: window.location.pathname,
        search: window.location.search,
        isEmbedded: window.parent !== window,
      }),
    })
  : null

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase environment variables are not configured.')
  }

  return supabase
}
