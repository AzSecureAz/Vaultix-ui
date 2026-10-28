import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/query-client'
import { AppRoutes } from '@/routes/AppRoutes'
import { useThemeStore } from '@/stores/themeStore'

export default function App() {
  const { resolvedTheme } = useThemeStore()

  useEffect(() => {
    useThemeStore.getState().initTheme()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster theme={resolvedTheme} richColors position="top-right" closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
