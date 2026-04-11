import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  return (
    <div className="flex h-full bg-background">
      {/* Fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 w-60 z-30 flex flex-col bg-sidebar overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 ml-60">
        {/* Fixed topbar */}
        <header className="fixed top-0 left-60 right-0 h-16 z-20 bg-surface-container-lowest border-b border-outline-variant/40">
          <Topbar />
        </header>

        {/* Scrollable content */}
        <main className="mt-16 flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
