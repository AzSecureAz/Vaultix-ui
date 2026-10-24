import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light' | 'system'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'dark' | 'light'
  setTheme: (theme: Theme) => void
  initTheme: () => void
}

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyThemeClass(theme: 'dark' | 'light') {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.classList.add('light')
    root.style.colorScheme = 'light'
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'dark',

      setTheme: (theme: Theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme
        applyThemeClass(resolved)
        set({ theme, resolvedTheme: resolved })
      },

      initTheme: () => {
        const currentTheme = get().theme
        const resolved = currentTheme === 'system' ? getSystemTheme() : currentTheme
        applyThemeClass(resolved)
        set({ resolvedTheme: resolved })

        // Listen for system theme preference changes
        if (typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handler = (e: MediaQueryListEvent) => {
            if (get().theme === 'system') {
              const newResolved = e.matches ? 'dark' : 'light'
              applyThemeClass(newResolved)
              set({ resolvedTheme: newResolved })
            }
          }
          mediaQuery.removeEventListener('change', handler)
          mediaQuery.addEventListener('change', handler)
        }
      },
    }),
    {
      name: 'vaultix-theme-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
