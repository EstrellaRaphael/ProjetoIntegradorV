import { useAuthStore } from '../store/authStore'
import AdminDashboard from './Dashboard/AdminDashboard'
import ProfessorDashboard from './Dashboard/ProfessorDashboard'
import AlunoDashboard from './Dashboard/AlunoDashboard'

export default function DashboardPage() {
  const role = useAuthStore((s) => s.user?.role)

  if (role === 'ADMIN') return <AdminDashboard />
  if (role === 'PROFESSOR') return <ProfessorDashboard />
  return <AlunoDashboard />
}
