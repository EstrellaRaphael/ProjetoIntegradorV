import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { router } from './router'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#111c2d',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px -5px rgba(30,41,59,0.12)',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ba1a1a', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
