import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Link2,
  Shield,
  Fingerprint,
  Smartphone,
  Users,
  ShieldCheck,
  Lock,
  KeyRound,
  ShieldAlert,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { useCommandStore } from '@/stores/commandStore'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useSudoStore } from '@/stores/sudoStore'

export function CommandPalette() {
  const { isOpen, setOpen } = useCommandStore()
  const { user, hasPermission, hasRole, logout } = useAuthStore()
  const { resolvedTheme, setTheme } = useThemeStore()
  const { requestElevation } = useSudoStore()
  const navigate = useNavigate()

  /* Global Keyboard Shortcut: Cmd+K / Ctrl+K */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!isOpen)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setOpen])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  const hasUserAccess = hasPermission('user:*')
  const hasRoleAccess = hasPermission('role:*')
  const hasPermissionAccess = hasPermission('permission:*') || hasRole('ADMIN')
  const hasKeyAccess = hasPermission('key:*')

  if (!user) return null

  return (
    <CommandDialog open={isOpen} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No matching commands or pages found.</CommandEmpty>

        {/* Quick Navigation Group */}
        <CommandGroup heading="Account & Security">
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard'))}>
            <User className="h-4 w-4 mr-2 text-zinc-500" />
            <span>Profile Details</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/connected-accounts'))}>
            <Link2 className="h-4 w-4 mr-2 text-zinc-500" />
            <span>Connected Accounts</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/mfa'))}>
            <Shield className="h-4 w-4 mr-2 text-zinc-500" />
            <span>Two-Step Verification (MFA)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/passkeys'))}>
            <Fingerprint className="h-4 w-4 mr-2 text-zinc-500" />
            <span>Passkeys (Passwordless)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/sessions'))}>
            <Smartphone className="h-4 w-4 mr-2 text-zinc-500" />
            <span>Active Sessions</span>
          </CommandItem>
        </CommandGroup>

        {/* Administration Group */}
        {(hasUserAccess || hasRoleAccess || hasPermissionAccess || hasKeyAccess) && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Administration">
              {hasUserAccess && (
                <CommandItem onSelect={() => runCommand(() => navigate('/admin/users'))}>
                  <Users className="h-4 w-4 mr-2 text-blue-500" />
                  <span>Users Directory</span>
                </CommandItem>
              )}
              {hasRoleAccess && (
                <CommandItem onSelect={() => runCommand(() => navigate('/admin/roles'))}>
                  <ShieldCheck className="h-4 w-4 mr-2 text-purple-500" />
                  <span>Roles Directory</span>
                </CommandItem>
              )}
              {hasPermissionAccess && (
                <CommandItem onSelect={() => runCommand(() => navigate('/admin/permissions'))}>
                  <Lock className="h-4 w-4 mr-2 text-emerald-500" />
                  <span>Permissions Directory</span>
                </CommandItem>
              )}
              {hasKeyAccess && (
                <CommandItem onSelect={() => runCommand(() => navigate('/admin/signing-keys'))}>
                  <KeyRound className="h-4 w-4 mr-2 text-amber-500" />
                  <span>Signing Keys</span>
                </CommandItem>
              )}
            </CommandGroup>
          </>
        )}

        {/* Security & Actions Group */}
        <CommandSeparator />
        <CommandGroup heading="Security & Actions">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                requestElevation().catch(() => {})
              })
            }
          >
            <ShieldAlert className="h-4 w-4 mr-2 text-amber-500" />
            <span>Verify Identity (Trigger Sudo Mode)</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              })
            }
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4 mr-2 text-zinc-400" />
            ) : (
              <Moon className="h-4 w-4 mr-2 text-zinc-500" />
            )}
            <span>Toggle Theme ({resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'})</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(async () => {
                await logout()
                navigate('/login')
              })
            }
          >
            <LogOut className="h-4 w-4 mr-2 text-rose-500" />
            <span>Sign Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
