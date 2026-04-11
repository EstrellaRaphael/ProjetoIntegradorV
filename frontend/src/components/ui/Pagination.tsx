interface PaginationProps {
  page: number
  total: number
  limit: number
  onChange: (page: number) => void
}

export default function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/30">
      <span className="text-xs text-on-surface-variant">
        Exibindo <span className="font-medium">{from}–{to}</span> de <span className="font-medium">{total}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          className="btn-secondary btn-sm disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Anterior
        </button>
        <span className="text-xs text-on-surface-variant px-2">
          {page} / {totalPages}
        </span>
        <button
          className="btn-secondary btn-sm disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Próximo
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
