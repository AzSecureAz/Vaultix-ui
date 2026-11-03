import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { SudoModal } from '@/features/sudo/SudoModal'
import { CommandPalette } from '@/components/ui/CommandPalette'

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  /* Auto-close mobile drawer when location pathname changes */
  useEffect(() => {
    setMobileMenuOpen((prev) => (prev ? false : prev))
  }, [location.pathname])

  return (
    <div className="relative flex min-h-screen bg-[#fafbfc] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors selection:bg-blue-600 selection:text-white">
      {/* Ambient Atmospheric Background Glows */}
      <div className="fixed top-0 left-1/3 -translate-x-1/2 -top-40 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/10 via-indigo-500/10 to-transparent blur-[120px] pointer-events-none -z-0" />
      <div className="fixed bottom-0 right-10 w-[500px] h-[300px] bg-gradient-to-tl from-purple-600/5 via-blue-500/5 to-transparent blur-[140px] pointer-events-none -z-0" />

      {/* Main Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Content Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 max-w-full">
        <TopNav onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto min-w-0 max-w-full">
          <Outlet />
        </main>
      </div>

      {/* Global Security Modals */}
      <SudoModal />
      <CommandPalette />
    </div>
  )
}
