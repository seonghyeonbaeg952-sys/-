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
    let requestVersion = 0
    let verifiedUserId: string | null = null

    async function loadUserProfile(user: User | null, allowBackground = false) {
      if (!isMounted) {
        return
      }

      const request = ++requestVersion

      if (!user) {
        verifiedUserId = null
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

      // Refocus and token refresh must not replace an already authorized form.
      const isBackground = allowBackground && verifiedUserId === user.id
      if (!isBackground) verifiedUserId = null

      setAuthState((currentState) => ({
        ...currentState,
        user,
        profile: isBackground ? currentState.profile : null,
        isLoading: !isBackground,
        isAdmin: isBackground && currentState.isAdmin,
        isAuthenticated: true,
        isSupabaseConfigured: true,
        error: null,
      }))

      const profileResult = await getProfile(user.id)

      if (!isMounted || request !== requestVersion) {
        return
      }

      verifiedUserId = profileResult.data && !profileResult.error ? user.id : null
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
      const request = ++requestVersion
      const userResult = await getCurrentUser()

      // An auth event is newer evidence than this initial asynchronous lookup.
      if (!isMounted || request !== requestVersion) {
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

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      void loadUserProfile(
        event === 'SIGNED_OUT' ? null : session?.user ?? null,
        event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED',
      )
    })

    return () => {
      isMounted = false
      requestVersion += 1
      data.subscription.unsubscribe()
    }
  }, [])

  return authState
}
