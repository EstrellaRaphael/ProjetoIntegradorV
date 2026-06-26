import { formatGrade } from '../../utils/formatters'

interface GradeBadgeProps {
  value: string | number | undefined | null
}

export default function GradeBadge({ value }: GradeBadgeProps) {
  if (value === undefined || value === null)
    return <span className="text-on-surface-variant tabular-nums">—</span>

  const v = Number(value)
  const fmt = formatGrade(v)

  if (v >= 7) return <span className="badge badge-success tabular-nums">{fmt}</span>
  if (v >= 5) return <span className="badge badge-warning tabular-nums">{fmt}</span>
  return <span className="badge badge-danger tabular-nums">{fmt}</span>
}
