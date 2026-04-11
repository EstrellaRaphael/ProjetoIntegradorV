import Modal from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'warning'
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-on-surface-variant">{message}</p>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={() => { onConfirm(); onClose() }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
