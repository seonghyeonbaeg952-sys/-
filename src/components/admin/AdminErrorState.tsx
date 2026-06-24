import type { ReactNode } from 'react'

import { ErrorState } from '../common/ErrorState'

type AdminErrorStateProps = {
  action?: ReactNode
  description?: string
  title?: string
}

export function AdminErrorState({
  action,
  description,
  title = '관리자 데이터를 불러오지 못했습니다',
}: AdminErrorStateProps) {
  return <ErrorState action={action} description={description} title={title} />
}
