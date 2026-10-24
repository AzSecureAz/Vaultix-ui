import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { AppRoutes } from '@/routes/AppRoutes'
import { useThemeStore } from '@/stores/themeStore'

export default function App() {
  useEffect(() => {
    useThemeStore.getState().initTheme()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
