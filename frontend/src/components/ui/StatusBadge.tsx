import type { AlunoStatus } from '../../types'

const STYLE_MAP: Record<AlunoStatus, string> = {
  ATIVO: 'badge badge-success',
  INATIVO: 'badge badge-neutral',
  TRANCADO: 'badge badge-warning',
}

const LABEL_MAP: Record<AlunoStatus, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  TRANCADO: 'Trancado',
}

interface StatusBadgeProps {
  status: AlunoStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={STYLE_MAP[status] ?? 'badge badge-neutral'}>
      {LABEL_MAP[status] ?? status}
    </span>
  )
}
