import { SUPABASE_SETUP_MESSAGE, getSupabaseClientSafe } from './auth'
import type {
  CmsMutationPayload,
  CmsRecord,
  CmsResult,
  CmsRowFor,
  CmsTableName,
  CmsValue,
} from '../types/cms'

export const CMS_TABLES = [
  'site_settings',
  'about_sections',
  'hero_slides',
  'locations',
  'conductor',
  'accompanist',
  'members',
  'concerts',
  'notices',
  'gallery',
  'videos',
  'posters',
  'history',
  'join_info',
  'faq',
  'contacts',
] as const satisfies readonly CmsTableName[]

export type CmsOrderOption<TTable extends CmsTableName> = {
  column: Extract<keyof CmsRowFor<TTable>, string>
  ascending?: boolean
}

export type CmsFilterOption<TTable extends CmsTableName> = {
  column: Extract<keyof CmsRowFor<TTable>, string>
  value: CmsValue | undefined
}

export type CmsSearchOption<TTable extends CmsTableName> = {
  column: Extract<keyof CmsRowFor<TTable>, string>
  value: string
}

export type ListRowsOptions<TTable extends CmsTableName> = {
  table: TTable
  select?: string
  order?: CmsOrderOption<TTable>
  filters?: Array<CmsFilterOption<TTable>>
  search?: CmsSearchOption<TTable>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getErrorMessage(error: unknown) {
  if (isRecord(error) && typeof error.message === 'string') {
    return error.message
  }

  return ''
}

function getErrorStatus(error: unknown) {
  if (!isRecord(error)) {
    return ''
  }

  const status = error.status
  const code = error.code

  if (typeof status === 'number') {
    return String(status)
  }

  if (typeof status === 'string') {
    return status
  }

  return typeof code === 'string' ? code : ''
}

function toCmsError(error: unknown, fallback: string) {
  const message = getErrorMessage(error)
  const status = getErrorStatus(error)
  const lowerMessage = message.toLowerCase()

  if (
    status === '401' ||
    status === '403' ||
    status === '42501' ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('row-level security') ||
    lowerMessage.includes('rls')
  ) {
    return '관리자 권한이 없거나 RLS 정책으로 요청이 차단되었습니다.'
  }

  if (
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch')
  ) {
    return 'Supabase 연결에 실패했습니다. 네트워크와 환경변수를 확인해 주세요.'
  }

  return message || fallback
}

function normalizeRows<TTable extends CmsTableName>(
  data: unknown,
): Array<CmsRowFor<TTable>> {
  return Array.isArray(data) ? (data as Array<CmsRowFor<TTable>>) : []
}

function normalizeRow<TTable extends CmsTableName>(
  data: unknown,
): CmsRowFor<TTable> | null {
  return isRecord(data) ? (data as CmsRowFor<TTable>) : null
}

export async function listRows<TTable extends CmsTableName>({
  filters = [],
  order,
  search,
  select = '*',
  table,
}: ListRowsOptions<TTable>): Promise<CmsResult<Array<CmsRowFor<TTable>>>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  let query = clientResult.data.from(table).select(select)

  for (const filter of filters) {
    if (filter.value !== undefined && filter.value !== '') {
      query = query.eq(filter.column, filter.value)
    }
  }

  if (search?.value.trim()) {
    query = query.ilike(search.column, `%${search.value.trim()}%`)
  }

  if (order) {
    query = query.order(order.column, { ascending: order.ascending ?? true })
  }

  const { data, error } = await query

  if (error) {
    return {
      data: null,
      error: toCmsError(error, '목록을 불러오지 못했습니다.'),
    }
  }

  return { data: normalizeRows<TTable>(data), error: null }
}

export async function getRowById<TTable extends CmsTableName>(
  table: TTable,
  id: string,
  select = '*',
): Promise<CmsResult<CmsRowFor<TTable> | null>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data
    .from(table)
    .select(select)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return {
      data: null,
      error: toCmsError(error, '데이터를 불러오지 못했습니다.'),
    }
  }

  return { data: normalizeRow<TTable>(data), error: null }
}

export async function createRow<TTable extends CmsTableName>(
  table: TTable,
  payload: CmsMutationPayload,
): Promise<CmsResult<CmsRowFor<TTable>>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data
    .from(table)
    .insert(payload)
    .select()
    .single()

  if (error) {
    return {
      data: null,
      error: toCmsError(error, '저장에 실패했습니다.'),
    }
  }

  const row = normalizeRow<TTable>(data)

  if (!row) {
    return { data: null, error: '저장 결과를 확인하지 못했습니다.' }
  }

  return { data: row, error: null }
}

export async function updateRow<TTable extends CmsTableName>(
  table: TTable,
  id: string,
  payload: CmsMutationPayload,
): Promise<CmsResult<CmsRowFor<TTable>>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data
    .from(table)
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return {
      data: null,
      error: toCmsError(error, '수정에 실패했습니다.'),
    }
  }

  const row = normalizeRow<TTable>(data)

  if (!row) {
    return { data: null, error: '수정 결과를 확인하지 못했습니다.' }
  }

  return { data: row, error: null }
}

export async function deleteRow<TTable extends CmsTableName>(
  table: TTable,
  id: string,
): Promise<CmsResult<true>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { error } = await clientResult.data.from(table).delete().eq('id', id)

  if (error) {
    return {
      data: null,
      error: toCmsError(error, '삭제에 실패했습니다.'),
    }
  }

  return { data: true, error: null }
}

export async function upsertSingleRow<TTable extends CmsTableName>(
  table: TTable,
  payload: CmsMutationPayload,
): Promise<CmsResult<CmsRowFor<TTable>>> {
  const existingRows = await listRows({
    order: { column: 'created_at' as Extract<keyof CmsRowFor<TTable>, string> },
    table,
  })

  if (!existingRows.data) {
    return {
      data: null,
      error: existingRows.error ?? '기존 데이터를 확인하지 못했습니다.',
    }
  }

  const firstRow = existingRows.data[0]

  if (firstRow?.id) {
    return updateRow(table, firstRow.id, payload)
  }

  return createRow(table, payload)
}

export function getPublicImageFallback(kind: 'gallery' | 'poster' | 'hero') {
  if (kind === 'poster') {
    return '/images/placeholders/poster-placeholder.svg'
  }

  if (kind === 'hero') {
    return '/images/placeholders/hero-1.svg'
  }

  return '/images/placeholders/gallery-placeholder.svg'
}

export function cleanPayload(payload: CmsMutationPayload): CmsMutationPayload {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as CmsMutationPayload
}

export function getRecordTitle(row: CmsRecord, fallback: string) {
  const title = row.title
  const name = row.name
  const question = row.question

  if (typeof title === 'string' && title.trim()) {
    return title
  }

  if (typeof name === 'string' && name.trim()) {
    return name
  }

  if (typeof question === 'string' && question.trim()) {
    return question
  }

  return fallback
}
