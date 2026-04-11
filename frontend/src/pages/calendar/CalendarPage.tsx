import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { calendarService } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import type { CalendarioEvento, CalendarioTipo } from '../../types'
import Modal from '../../components/ui/Modal'

const TIPO_LABELS: Record<CalendarioTipo, string> = {
  AULA: 'Aula', FERIADO: 'Feriado', RECESSO: 'Recesso', EVENTO: 'Evento',
}

const TIPO_BADGES: Record<CalendarioTipo, string> = {
  AULA: 'badge badge-primary',
  FERIADO: 'badge badge-danger',
  RECESSO: 'badge badge-warning',
  EVENTO: 'badge badge-secondary',
}

const TIPO_COLORS: Record<CalendarioTipo, string> = {
  AULA: 'bg-primary-fixed text-primary',
  FERIADO: 'bg-error-container text-on-error-container',
  RECESSO: 'bg-warning-container text-warning',
  EVENTO: 'bg-secondary-container text-on-surface-variant',
}

type ViewMode = 'lista' | 'calendario'

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) {
    days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

export default function CalendarPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  const [view, setView] = useState<ViewMode>('lista')
  const [modalOpen, setModalOpen] = useState(false)
  const [calDate, setCalDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() })
  const [form, setForm] = useState({ data: '', descricao: '', tipo: 'EVENTO' as CalendarioTipo })

  const { data, isLoading } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => calendarService.list().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => calendarService.create(d),
    onSuccess: () => {
      toast.success('Evento criado!')
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      setModalOpen(false)
      setForm({ data: '', descricao: '', tipo: 'EVENTO' })
    },
    onError: () => toast.error('Erro ao criar evento.'),
  })

  const events: CalendarioEvento[] = Array.isArray(data) ? data : data?.data ?? []

  // Calendar grid
  const days = getDaysInMonth(calDate.year, calDate.month)
  const firstDay = days[0].getDay() // 0=Sun
  const monthName = new Date(calDate.year, calDate.month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  function eventsOnDate(date: Date): CalendarioEvento[] {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter((e) => e.data.split('T')[0] === dateStr)
  }

  function prevMonth() {
    setCalDate((p) => {
      if (p.month === 0) return { year: p.year - 1, month: 11 }
      return { ...p, month: p.month - 1 }
    })
  }

  function nextMonth() {
    setCalDate((p) => {
      if (p.month === 11) return { year: p.year + 1, month: 0 }
      return { ...p, month: p.month + 1 }
    })
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendário Escolar</h1>
          <p className="page-subtitle">Eventos, feriados e datas importantes</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border border-outline-variant overflow-hidden">
            <button
              onClick={() => setView('lista')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${view === 'lista' ? 'bg-primary text-white' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'}`}
            >
              Lista
            </button>
            <button
              onClick={() => setView('calendario')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${view === 'calendario' ? 'bg-primary text-white' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'}`}
            >
              Calendário
            </button>
          </div>
          {isAdmin && (
            <button className="btn-primary" onClick={() => setModalOpen(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Novo Evento
            </button>
          )}
        </div>
      </div>

      {view === 'lista' && (
        <div className="table-wrap">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-surface-container animate-pulse rounded-lg" />)}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant text-sm">Nenhum evento cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-head">
                  <tr>
                    <th className="th">Data</th>
                    <th className="th">Descrição</th>
                    <th className="th">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {[...events]
                    .sort((a, b) => a.data.localeCompare(b.data))
                    .map((e) => (
                      <tr key={e.id} className="tr-row">
                        <td className="td font-mono text-sm">
                          {new Date(e.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="td font-medium">{e.descricao}</td>
                        <td className="td">
                          <span className={TIPO_BADGES[e.tipo]}>{TIPO_LABELS[e.tipo]}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === 'calendario' && (
        <div className="card-padded">
          {/* Nav */}
          <div className="flex items-center justify-between mb-4">
            <button className="btn-secondary btn-sm" onClick={prevMonth}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <h3 className="text-sm font-semibold text-on-surface capitalize">{monthName}</h3>
            <button className="btn-secondary btn-sm" onClick={nextMonth}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-on-surface-variant py-2">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const dayEvents = eventsOnDate(day)
              const isToday = day.toDateString() === new Date().toDateString()
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[4.5rem] p-1 rounded-lg border ${isToday ? 'border-primary bg-primary-fixed/30' : 'border-outline-variant/20 hover:bg-surface-container/50'}`}
                >
                  <p className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {day.getDate()}
                  </p>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div key={e.id} className={`text-[10px] px-1 py-0.5 rounded truncate ${TIPO_COLORS[e.tipo]}`}>
                        {e.descricao}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-on-surface-variant">+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Novo Evento" size="sm">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...form }) }} className="space-y-4">
          <div>
            <label className="field-label">Data *</label>
            <input type="date" className="input-field" value={form.data} onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))} required />
          </div>
          <div>
            <label className="field-label">Descrição *</label>
            <input className="input-field" value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} required />
          </div>
          <div>
            <label className="field-label">Tipo *</label>
            <select className="input-field" value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as CalendarioTipo }))}>
              {(Object.keys(TIPO_LABELS) as CalendarioTipo[]).map((t) => (
                <option key={t} value={t}>{TIPO_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>{createMutation.isPending ? 'Criando…' : 'Criar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
