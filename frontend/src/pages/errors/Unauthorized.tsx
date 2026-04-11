import { useNavigate } from 'react-router-dom'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <p className="text-9xl font-black text-outline-variant select-none">403</p>
        <h1 className="text-2xl font-semibold text-on-surface mt-4">Sem permissão</h1>
        <p className="text-on-surface-variant mt-2 text-sm max-w-sm mx-auto">
          Você não tem permissão para acessar esta página.
          Verifique seu perfil de acesso.
        </p>
        <div className="flex justify-center gap-3 mt-6">
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Voltar
          </button>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            Ir ao Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
