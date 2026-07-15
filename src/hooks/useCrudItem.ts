import { useCallback, useEffect, useState } from 'react'

import { listRows, upsertSingleRow } from '../lib/cms'
import type {
  CmsMutationPayload,
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
      })

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

  const clearMutationError = useCallback(() => {
    setState((current) => ({
      ...current,
      mutationError: null,
    }))
  }, [])

  const saveItem = useCallback(
    async (payload: CmsMutationPayload) => {
      setState((current) => ({
        ...current,
        isMutating: true,
        message: null,
        mutationError: null,
      }))

      const result = await upsertSingleRow(table, payload)

      setState((current) => ({
        ...current,
        isMutating: false,
        item: result.data ?? current.item,
        message: result.error ? null : '저장되었습니다.',
        mutationError: result.error,
      }))

      if (!result.error) {
        invalidatePublicDataCache()
        reload()
      }

      return result
    },
    [reload, table],
  )

  return {
    ...state,
    clearMutationError,
    error: state.loadError ?? state.mutationError,
    reload,
    saveItem,
  }
}
