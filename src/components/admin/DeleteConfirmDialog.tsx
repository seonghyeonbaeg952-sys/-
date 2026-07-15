import { Button } from '../common/Button'
import { AdminModal } from './AdminModal'

type DeleteConfirmDialogProps = {
  error?: string | null
  isDeleting?: boolean
  isOpen: boolean
  itemName: string
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmDialog({
  error,
  isDeleting = false,
  isOpen,
  itemName,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const handleClose = () => {
    if (!isDeleting) {
      onClose()
    }
  }

  return (
    <AdminModal
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button disabled={isDeleting} onClick={handleClose} variant="secondary">
            취소
          </Button>
          <Button
            className="!bg-state-error !text-bg-warm-white hover:!bg-state-error/90"
            disabled={isDeleting}
            onClick={onConfirm}
            variant="primary"
          >
            {isDeleting ? '삭제 중' : '삭제'}
          </Button>
        </div>
      }
      isOpen={isOpen}
      onClose={handleClose}
      title="삭제 확인"
    >
      {error ? (
        <p
          className="mb-4 rounded-button bg-state-error/10 px-4 py-3 text-sm leading-6 text-state-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <p className="break-keep text-sm leading-7 text-text-muted">
        <span className="font-semibold text-navy-deep">{itemName}</span> 항목을
        삭제하시겠습니까? 삭제 후에는 public 화면과 관리자 목록에서 사라지며,
        이 작업은 되돌릴 수 없습니다.
      </p>
    </AdminModal>
  )
}
