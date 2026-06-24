import { useCallback, useEffect, useState } from 'react'

import { listRows, upsertSingleRow } from '../lib/cms'
import type {
  CmsMutationPayload,
  CmsRowFor,
  CmsTableName,
} from '../types/cms'

type CrudItemState<TTable extends CmsTableName> = {
  error: string | null
  isLoading: boolean
  isMutating: boolean
  item: CmsRowFor<TTable> | null
  message: string | null
}

export function useCrudItem<TTable extends CmsTableName>(table: TTable) {
  const [reloadToken, setReloadToken] = useState(0)
  const [state, setState] = useState<CrudItemState<TTable>>({
    error: null,
    isLoading: true,
    isMutating: false,
    item: null,
    message: null,
  })

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadItem() {
      setState((current) => ({
        ...current,
        error: null,
        isLoading: true,
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
        error: result.error,
        isLoading: false,
        item: result.data?.[0] ?? null,
      }))
    }

    void loadItem()

    return () => {
      isMounted = false
    }
  }, [reloadToken, table])

  const saveItem = useCallback(
    async (payload: CmsMutationPayload) => {
      setState((current) => ({
        ...current,
        error: null,
        isMutating: true,
        message: null,
      }))

      const result = await upsertSingleRow(table, payload)

      setState((current) => ({
        ...current,
        error: result.error,
        isMutating: false,
        item: result.data ?? current.item,
        message: result.error ? null : '저장되었습니다.',
      }))

      if (!result.error) {
        reload()
      }

      return result
    },
    [reload, table],
  )

  return {
    ...state,
    reload,
    saveItem,
  }
}
