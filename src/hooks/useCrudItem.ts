import { useCallback, useEffect, useRef, useState } from 'react'

import { listRows, upsertSingleRow } from '../lib/cms'
import type {
  CmsMutationPayload,
  CmsResult,
  CmsRowFor,
  CmsTableName,
} from '../types/cms'
import { invalidatePublicDataCache } from './usePublicData'

type CrudItemState<TTable extends CmsTableName> = {
  isLoading: boolean
  isMutating: boolean
  item: CmsRowFor<TTable> | null
  loadError: string | null
  message: string | null
  mutationError: string | null
}

export function useCrudItem<TTable extends CmsTableName>(table: TTable) {
  const [reloadToken, setReloadToken] = useState(0)
  const mutationLock = useRef(false)
  const [state, setState] = useState<CrudItemState<TTable>>({
    isLoading: true,
    isMutating: false,
    item: null,
    loadError: null,
    message: null,
    mutationError: null,
  })

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadItem() {
      setState((current) => ({
        ...current,
        isLoading: true,
        loadError: null,
      }))

      const result = await listRows({
        order: {
          column: 'created_at' as Extract<keyof CmsRowFor<TTable>, string>,
        },
        table,
      }).catch(() => ({ data: null, error: '자료를 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.' }))

      if (!isMounted) {
        return
      }

      setState((current) => ({
        ...current,
        isLoading: false,
        item: result.data?.[0] ?? null,
        loadError: result.error,
      }))
    }

    void loadItem()

    return () => {
      isMounted = false
    }
  }, [reloadToken, table])

  const clearMutationFeedback = useCallback(() => {
    setState((current) => ({
      ...current,
      message: null,
      mutationError: null,
    }))
  }, [])

  const saveItem = useCallback(
    async (payload: CmsMutationPayload): Promise<CmsResult<CmsRowFor<TTable>>> => {
      if (mutationLock.current) return { data: null, error: '저장 중입니다. 완료될 때까지 기다려 주세요.' }
      mutationLock.current = true
      setState((current) => ({
        ...current,
        isMutating: true,
        message: null,
        mutationError: null,
      }))

      try {
        const result = await upsertSingleRow(table, payload)
        const error = result.error ?? (!result.data ? '저장 결과를 확인하지 못했습니다. 입력 내용은 유지됩니다.' : null)
        setState((current) => ({
          ...current,
          item: error ? current.item : result.data,
          message: error ? null : '저장되었습니다.',
          mutationError: error,
        }))
        if (!error) invalidatePublicDataCache()
        return error ? { data: null, error } : result
      } catch {
        const error = '저장에 실패했습니다. 입력 내용은 유지됩니다. 연결을 확인하고 다시 시도해 주세요.'
        setState((current) => ({ ...current, mutationError: error }))
        return { data: null, error }
      } finally {
        mutationLock.current = false
        setState((current) => ({ ...current, isMutating: false }))
      }
    },
    [table],
  )

  return {
    ...state,
    clearMutationFeedback,
    error: state.loadError ?? state.mutationError,
    reload,
    saveItem,
  }
}
