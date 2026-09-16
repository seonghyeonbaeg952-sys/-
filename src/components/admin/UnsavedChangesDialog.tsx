import { useBlocker } from 'react-router'
import { getUnsavedChangesMessage, shouldBlockUnsavedNavigation } from '../../hooks/useUnsavedChangesGuard'
import { Button } from '../common/Button'
import { AdminModal } from './AdminModal'

/** One router-level guard for all dirty forms; beforeunload covers full reloads. */
export function UnsavedChangesDialog() {
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    shouldBlockUnsavedNavigation(currentLocation.pathname, nextLocation.pathname))
  const blocked = blocker.state === 'blocked'
  return <AdminModal
    isOpen={blocked}
    title="저장하지 않은 내용이 있습니다"
    onClose={() => { if (blocked) blocker.reset() }}
    footer={<div className="flex flex-wrap justify-end gap-3">
      <Button variant="secondary" onClick={() => { if (blocked) blocker.reset() }}>계속 편집</Button>
      <Button onClick={() => { if (blocked) blocker.proceed() }}>저장하지 않고 나가기</Button>
    </div>}
  >
    <p>{getUnsavedChangesMessage()}</p>
    <p className="mt-3 text-sm text-text-muted">계속 편집을 선택하면 현재 입력이 유지됩니다. 저장 중인 요청은 화면을 나가도 처리될 수 있으므로 완료 여부를 먼저 확인하세요.</p>
  </AdminModal>
}
