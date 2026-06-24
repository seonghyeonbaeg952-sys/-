import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { getCurrentUser, getProfile, SUPABASE_SETUP_MESSAGE } from '../lib/auth'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import type { AuthState } from '../types/admin'

const initialAuthState: AuthState = {
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isSupabaseConfigured: hasSupabaseConfig,
  error: null,
}

const missingConfigAuthState: AuthState = {
  user: null,
  profile: null,
  isLoading: false,
  isAuthenticated: false,
  isAdmin: false,
  isSupabaseConfigured: false,
  error: SUPABASE_SETUP_MESSAGE,
}

export function useAdminAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>(
    hasSupabaseConfig ? initialAuthState : missingConfigAuthState,
  )

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      return
    }

    let isMounted = true

    async function loadUserProfile(user: User | null) {
      if (!isMounted) {
        return
      }

      if (!user) {
        setAuthState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
          isAdmin: false,
          isSupabaseConfigured: true,
          error: null,
        })
        return
      }

      setAuthState((currentState) => ({
        ...currentState,
        user,
        isLoading: true,
        isAuthenticated: true,
        isSupabaseConfigured: true,
        error: null,
      }))

      const profileResult = await getProfile(user.id)

      if (!isMounted) {
        return
      }

      setAuthState({
        user,
        profile: profileResult.data,
        isLoading: false,
        isAuthenticated: true,
        isAdmin: profileResult.data?.role === 'admin',
        isSupabaseConfigured: true,
        error: profileResult.error,
      })
    }

    async function loadInitialAuthState() {
      const userResult = await getCurrentUser()

      if (!isMounted) {
        return
      }

      if (userResult.error) {
        setAuthState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
          isAdmin: false,
          isSupabaseConfigured: true,
          error: userResult.error,
        })
        return
      }

      await loadUserProfile(userResult.data)
    }

    void loadInitialAuthState()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadUserProfile(session?.user ?? null)
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  return authState
}
