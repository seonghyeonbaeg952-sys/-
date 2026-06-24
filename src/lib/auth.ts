import type { Session, SupabaseClient, User } from '@supabase/supabase-js'

import { hasSupabaseConfig, supabase } from './supabase'
import type { AdminProfile, AdminRole } from '../types/admin'

export const SUPABASE_SETUP_MESSAGE =
  'Supabase 설정이 필요합니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 .env.local에 설정해 주세요.'

export type AuthActionResult<TData> =
  | { data: TData; error: null }
  | { data: null; error: string }

type ProfileRow = {
  id: string
  email: string | null
  role: AdminRole
  created_at: string
  updated_at: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getStringValue(row: Record<string, unknown>, key: keyof ProfileRow) {
  const value = row[key]

  return typeof value === 'string' ? value : null
}

function isAdminRole(role: string | null): role is AdminRole {
  return role === 'admin' || role === 'viewer'
}

function normalizeProfile(value: unknown): AdminProfile | null {
  if (!isRecord(value)) {
    return null
  }

  const id = getStringValue(value, 'id')
  const email = getStringValue(value, 'email')
  const role = getStringValue(value, 'role')
  const createdAt = getStringValue(value, 'created_at')
  const updatedAt = getStringValue(value, 'updated_at')

  if (!id || !isAdminRole(role) || !createdAt || !updatedAt) {
    return null
  }

  return {
    id,
    email,
    role,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

function getErrorMessage(error: unknown) {
  if (isRecord(error) && typeof error.message === 'string') {
    return error.message
  }

  return ''
}

function isMissingSessionError(message: string) {
  const lowerMessage = message.toLowerCase()

  return (
    lowerMessage.includes('auth session missing') ||
    lowerMessage.includes('session_not_found') ||
    lowerMessage.includes('missing session')
  )
}

function toFriendlyAuthError(error: unknown, fallback: string) {
  const message = getErrorMessage(error)
  const lowerMessage = message.toLowerCase()

  if (!message) {
    return fallback
  }

  if (
    lowerMessage.includes('invalid login credentials') ||
    lowerMessage.includes('invalid_credentials')
  ) {
    return '이메일 또는 비밀번호를 확인해 주세요.'
  }

  if (lowerMessage.includes('email not confirmed')) {
    return '이메일 인증이 필요한 계정입니다. Supabase Auth 설정을 확인해 주세요.'
  }

  if (
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch')
  ) {
    return '네트워크 연결을 확인한 뒤 다시 시도해 주세요.'
  }

  if (lowerMessage.includes('jwt')) {
    return '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.'
  }

  return fallback
}

export function getSupabaseClientSafe(): AuthActionResult<SupabaseClient> {
  if (!hasSupabaseConfig || !supabase) {
    return { data: null, error: SUPABASE_SETUP_MESSAGE }
  }

  return { data: supabase, error: null }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthActionResult<{ user: User; session: Session }>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      data: null,
      error: toFriendlyAuthError(error, '로그인에 실패했습니다. 입력값을 확인해 주세요.'),
    }
  }

  if (!data.user || !data.session) {
    return {
      data: null,
      error: '로그인 응답을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  return { data: { user: data.user, session: data.session }, error: null }
}

export async function signOut(): Promise<AuthActionResult<true>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { error } = await clientResult.data.auth.signOut()

  if (error) {
    return {
      data: null,
      error: toFriendlyAuthError(error, '로그아웃에 실패했습니다. 다시 시도해 주세요.'),
    }
  }

  return { data: true, error: null }
}

export async function getCurrentSession(): Promise<AuthActionResult<Session | null>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data.auth.getSession()

  if (error) {
    return {
      data: null,
      error: toFriendlyAuthError(error, '로그인 세션을 확인하지 못했습니다.'),
    }
  }

  return { data: data.session, error: null }
}

export async function getCurrentUser(): Promise<AuthActionResult<User | null>> {
  const sessionResult = await getCurrentSession()

  if (sessionResult.error) {
    return { data: null, error: sessionResult.error }
  }

  if (!sessionResult.data) {
    return { data: null, error: null }
  }

  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data.auth.getUser()

  if (error) {
    const message = getErrorMessage(error)

    if (isMissingSessionError(message)) {
      return { data: null, error: null }
    }

    return {
      data: null,
      error: toFriendlyAuthError(error, '현재 로그인 사용자를 확인하지 못했습니다.'),
    }
  }

  return { data: data.user, error: null }
}

export async function getProfile(
  userId?: string,
): Promise<AuthActionResult<AdminProfile | null>> {
  const targetUserId = userId ?? (await getCurrentUser()).data?.id

  if (!targetUserId) {
    return { data: null, error: null }
  }

  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data
    .from('profiles')
    .select('id, email, role, created_at, updated_at')
    .eq('id', targetUserId)
    .maybeSingle()

  if (error) {
    return {
      data: null,
      error: toFriendlyAuthError(error, '관리자 프로필 정보를 불러오지 못했습니다.'),
    }
  }

  if (!data) {
    return { data: null, error: null }
  }

  const profile = normalizeProfile(data as unknown)

  if (!profile) {
    return {
      data: null,
      error: '프로필 권한 정보가 올바르지 않습니다. Supabase profiles 테이블을 확인해 주세요.',
    }
  }

  return { data: profile, error: null }
}

export async function isAdmin(): Promise<AuthActionResult<boolean>> {
  const profileResult = await getProfile()

  if (profileResult.error) {
    return { data: null, error: profileResult.error }
  }

  return { data: profileResult.data?.role === 'admin', error: null }
}

export async function updatePassword(
  password: string,
): Promise<AuthActionResult<User>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data.auth.updateUser({
    password,
  })

  if (error) {
    return {
      data: null,
      error: toFriendlyAuthError(error, '비밀번호 변경에 실패했습니다. 다시 시도해 주세요.'),
    }
  }

  if (!data.user) {
    return {
      data: null,
      error: '비밀번호 변경 결과를 확인하지 못했습니다. 다시 로그인해 주세요.',
    }
  }

  return { data: data.user, error: null }
}
