import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { communicationsService, studentsService, teachersService } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function roleLabel(role: string | undefined) {
  if (role === 'ADMIN') return 'Administrador'
  if (role === 'PROFESSOR') return 'Professor'
  if (role === 'ALUNO') return 'Aluno'
  return role ?? ''
}

export default function Topbar() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: unreadData } = useQuery({
    queryKey: ['communications', 'unread'],
    queryFn: () => communicationsService.unread().then((r) => r.data),
    refetchInterval: 60_000,
  })

  const { data: alunoProfile } = useQuery({
    queryKey: ['students', 'me'],
    queryFn: () => studentsService.me().then((r) => r.data),
    enabled: user?.role === 'ALUNO',
  })

  const { data: professorProfile } = useQuery({
    queryKey: ['teachers', 'me'],
    queryFn: () => teachersService.me().then((r) => r.data),
    enabled: user?.role === 'PROFESSOR',
  })

  const unreadCount: number =
    Array.isArray(unreadData)
      ? unreadData.length
      : typeof unreadData?.count === 'number'
      ? unreadData.count
      : 0

  const displayName =
    user?.role === 'ALUNO'
      ? (alunoProfile?.nome_completo ?? 'Aluno')
      : user?.role === 'PROFESSOR'
      ? (professorProfile?.nome_completo ?? 'Professor')
      : 'Administrador'

  const initials = getInitials(displayName)

  return (
    <div className="h-full flex items-center justify-between px-6">
      {/* Left */}
      <span className="text-base font-bold text-on-surface tracking-tight">
        Gestão Escolar
      </span>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => navigate('/communications')}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors relative"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-outline-variant/50" />

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-on-surface leading-tight">{displayName}</p>
            <p className="text-xs text-on-surface-variant">{roleLabel(user?.role)}</p>
          </div>

          {/* Role badge */}
          <span className={`badge text-[10px] hidden md:inline-flex ${
            user?.role === 'ADMIN' ? 'badge-primary' :
            user?.role === 'PROFESSOR' ? 'badge-secondary' :
            'badge-neutral'
          }`}>
            {roleLabel(user?.role)}
          </span>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
