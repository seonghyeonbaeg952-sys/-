import { LoadingState } from '../common/LoadingState'

type AdminLoadingStateProps = {
  label?: string
}

export function AdminLoadingState({
  label = '관리자 데이터를 불러오는 중입니다',
}: AdminLoadingStateProps) {
  return <LoadingState label={label} />
}
