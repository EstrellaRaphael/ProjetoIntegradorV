import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import StudentListPage from './pages/students/StudentList'
import StudentDetailPage from './pages/students/StudentDetail'
import StudentFormPage from './pages/students/StudentForm'
import TeacherListPage from './pages/teachers/TeacherList'
import TeacherDetailPage from './pages/teachers/TeacherDetail'
import ClassListPage from './pages/classes/ClassList'
import ClassDetailPage from './pages/classes/ClassDetail'
import DisciplineListPage from './pages/disciplines/DisciplineList'
import CalendarPage from './pages/calendar/CalendarPage'
import AssessmentListPage from './pages/assessments/AssessmentList'
import GradeLaunchPage from './pages/grades/GradeLaunch'
import BoletimPage from './pages/grades/Boletim'
import FrequencyPage from './pages/grades/Frequency'
import CommunicationsPage from './pages/communications/CommunicationsPage'
import SettingsPage from './pages/settings/SettingsPage'
import NotFoundPage from './pages/errors/NotFound'
import UnauthorizedPage from './pages/errors/Unauthorized'

// Guard: redireciona para /login se não autenticado
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      // Alunos
      { path: 'students', element: <StudentListPage /> },
      { path: 'students/new', element: <StudentFormPage /> },
      { path: 'students/:id', element: <StudentDetailPage /> },
      { path: 'students/:id/edit', element: <StudentFormPage /> },
      // Professores
      { path: 'teachers', element: <TeacherListPage /> },
      { path: 'teachers/:id', element: <TeacherDetailPage /> },
      // Turmas
      { path: 'classes', element: <ClassListPage /> },
      { path: 'classes/:id', element: <ClassDetailPage /> },
      // Disciplinas
      { path: 'disciplines', element: <DisciplineListPage /> },
      // Calendário
      { path: 'calendar', element: <CalendarPage /> },
      // Avaliações
      { path: 'assessments', element: <AssessmentListPage /> },
      // Notas
      { path: 'grades', element: <GradeLaunchPage /> },
      { path: 'grades/:alunoId/boletim', element: <BoletimPage /> },
      { path: 'boletim', element: <BoletimPage /> },
      // Frequência
      { path: 'frequency', element: <FrequencyPage /> },
      // Comunicados
      { path: 'communications', element: <CommunicationsPage /> },
      // Configurações
      { path: 'settings', element: <SettingsPage /> },
      // Erros
      { path: 'unauthorized', element: <UnauthorizedPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
