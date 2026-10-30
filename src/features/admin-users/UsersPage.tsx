import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Users,
  UserPlus,
  RefreshCw,
  Loader2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  X,
  Edit3,
  Trash2,
  RotateCcw,
  Power,
  Check,
  Copy,
  Shield,
  Fingerprint,
  Mail,
  UserCheck,
  AlertTriangle,
  Search,
  KeyRound,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { usersApi, type UserItem } from './api/usersApi'
import { rolesApi, type RoleItem } from '../admin-roles/api/rolesApi'
import { cn } from '@/lib/utils'

export function UsersPage() {
  const { user, hasPermission } = useAuthStore()

  // Fine-grained capability checks
  const canRead = hasPermission('user:read')
  const canCreate = hasPermission('user:create')
  const canUpdate = hasPermission('user:update')
  const canDelete = hasPermission('user:delete')
  const canRestore = hasPermission('user:restore')

  // User's active level (lower numeric level = higher privilege)
  const userLevel = user?.level ?? Infinity

  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<{ status?: number; message: string } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(text)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // URL pagination state
  const [searchParams, setSearchParams] = useSearchParams()
  const rawPage = parseInt(searchParams.get('page') || '1', 10)
  const currentPage = isNaN(rawPage) || rawPage < 1 ? 0 : rawPage - 1

  const rawSize = parseInt(searchParams.get('size') || '10', 10)
  const pageSize = [10, 20, 50].includes(rawSize) ? rawSize : 10

  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isFirst, setIsFirst] = useState(true)
  const [isLast, setIsLast] = useState(true)

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createUsername, setCreateUsername] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createFullName, setCreateFullName] = useState('')
  const [createRoles, setCreateRoles] = useState<string[]>([])
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Edit Roles Modal
  const [userToEdit, setUserToEdit] = useState<UserItem | null>(null)
  const [editRoles, setEditRoles] = useState<string[]>([])
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete User Confirmation Modal
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Role search in modals
  const [roleSearchQuery, setRoleSearchQuery] = useState('')
  const [availableRoles, setAvailableRoles] = useState<RoleItem[]>([])
  const [searchingRoles, setSearchingRoles] = useState(false)

  // Fetch roles for assignment dropdown/chips
  const fetchAvailableRoles = async (query = '') => {
    setSearchingRoles(true)
    try {
      const res = await rolesApi.getAssignableRoles(query, 0, 30)
      if (res.success && res.data) {
        const items = res.data.content || []
        // Only show ENABLED roles whose level is strictly lower privilege than current actor's level
        setAvailableRoles(items.filter((r) => r.status === 'ENABLED' && r.level > userLevel))
      }
    } catch {
      // Ignore background role search errors
    } finally {
      setSearchingRoles(false)
    }
  }

  // 300ms debounced search for assignable roles in modals
  useEffect(() => {
    if (!isCreateOpen && !userToEdit) return

    const timer = setTimeout(() => {
      fetchAvailableRoles(roleSearchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [roleSearchQuery, isCreateOpen, userToEdit])

  // Fetch users from backend
  const fetchUsers = async (page = currentPage, size = pageSize) => {
    if (!canRead) {
      setLoading(false)
      setFetchError({
        status: 403,
        message: 'Access denied: You do not have permission to view enterprise users (requires user:read).',
      })
      setUsers([])
      setTotalElements(0)
      setTotalPages(1)
      setIsFirst(true)
      setIsLast(true)
      return
    }

    setLoading(true)
    setFetchError(null)

    try {
      const res = await usersApi.getUsers(page, size)
      if (res.success && res.data) {
        setFetchError(null)
        const data = res.data
        const items = data.content || []
        setUsers(items)

        const pageInfo = data.page
        const total = pageInfo?.total_elements ?? data.total_elements ?? data.totalElements ?? items.length
        const pages = pageInfo?.total_pages ?? data.total_pages ?? data.totalPages ?? Math.max(1, Math.ceil(total / size))
        const pageNum = pageInfo?.number ?? data.number ?? page

        setTotalElements(total)
        setTotalPages(pages)
        setIsFirst(pageNum === 0)
        setIsLast(pageNum >= pages - 1)

        if (page >= pages && pages > 0) {
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.set('page', String(pages))
            return next
          })
        }
      } else {
        const errorMsg = res.message || 'Failed to retrieve enterprise user directory.'
        setFetchError({ message: errorMsg })
        setUsers([])
      }
    } catch (err: any) {
      const status = err?.response?.status
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to connect to Authorization Service for user directory.'
      setFetchError({ status, message: errorMsg })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(currentPage, pageSize)
  }, [currentPage, pageSize, canRead])

  // Pagination navigation helpers
  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= totalPages) return
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(newPage + 1))
      return next
    })
  }

  const handlePageSizeChange = (newSize: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      next.set('size', String(newSize))
      return next
    })
  }

  // Toggle User Status (ENABLE / DISABLE)
  const handleToggleStatus = async (targetUser: UserItem) => {
    if (!canUpdate || actionLoadingId || targetUser.status === 'DELETED') return

    // Hierarchy validation: cannot modify self or equal/higher privilege user
    if (targetUser.id === user?.id) {
      toast.error('Cannot modify status of your own account.')
      return
    }

    const targetLevel = targetUser.level ?? Infinity
    if (targetLevel <= userLevel) {
      toast.error(
        `Hierarchy restriction: You cannot modify user '${targetUser.username}' (level ${targetLevel} has equal or higher authority than your level ${userLevel}).`
      )
      return
    }

    const isCurrentlyActive = targetUser.status === 'ACTIVE'
    const action = isCurrentlyActive ? 'disable' : 'enable'

    setActionLoadingId(targetUser.id)

    try {
      if (isCurrentlyActive) {
        await usersApi.disableUser(targetUser.username)
      } else {
        await usersApi.enableUser(targetUser.username)
      }

      setUsers((prev) =>
        prev.map((item) =>
          item.id === targetUser.id
            ? { ...item, status: isCurrentlyActive ? 'DISABLED' : 'ACTIVE' }
            : item
        )
      )
    } catch (err: any) {
      const isSudoCancelled = err?.message?.includes('cancelled')
      const errorMsg =
        err?.response?.data?.message ||
        (isSudoCancelled
          ? `Action cancelled: Sudo elevation is required to ${action} user '${targetUser.username}'.`
          : `Failed to ${action} user '${targetUser.username}'.`)
      toast.error(errorMsg)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Restore Soft-Deleted User
  const handleRestoreUser = async (targetUser: UserItem) => {
    if (!canRestore || actionLoadingId || targetUser.status !== 'DELETED') return

    const targetLevel = targetUser.level ?? Infinity
    if (targetLevel <= userLevel) {
      toast.error(
        `Hierarchy restriction: Cannot restore user '${targetUser.username}' with level ${targetLevel}.`
      )
      return
    }

    setActionLoadingId(targetUser.id)

    try {
      await usersApi.restoreUser(targetUser.username)
      setUsers((prev) =>
        prev.map((item) =>
          item.id === targetUser.id ? { ...item, status: 'DISABLED' } : item
        )
      )
    } catch (err: any) {
      const isSudoCancelled = err?.message?.includes('cancelled')
      const errorMsg =
        err?.response?.data?.message ||
        (isSudoCancelled
          ? `Action cancelled: Sudo elevation is required to restore user '${targetUser.username}'.`
          : `Failed to restore user '${targetUser.username}'.`)
      toast.error(errorMsg)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Create User Modal Handlers
  const openCreateModal = () => {
    setCreateUsername('')
    setCreateEmail('')
    setCreateFullName('')
    setCreateRoles([])
    setCreateError(null)
    setRoleSearchQuery('')
    setIsCreateOpen(true)
  }

  const handleRoleSearchChange = (query: string) => {
    setRoleSearchQuery(query)
  }

  const toggleCreateRole = (roleName: string) => {
    setCreateRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    )
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)

    const cleanUsername = createUsername.trim().toLowerCase()
    const cleanEmail = createEmail.trim().toLowerCase()
    const cleanFullName = createFullName.trim()

    if (!cleanUsername) {
      setCreateError('Username is required.')
      return
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setCreateError('A valid email address is required.')
      return
    }

    setCreateLoading(true)

    try {
      await usersApi.createUser({
        username: cleanUsername,
        email: cleanEmail,
        full_name: cleanFullName || undefined,
        fullName: cleanFullName || undefined,
        roles: createRoles,
      })

      setIsCreateOpen(false)
      toast.success(`User '${cleanUsername}' created successfully. Initial password must be set via password reset.`)
      if (canRead) {
        fetchUsers(currentPage, pageSize)
      }
    } catch (err: any) {
      const isSudoCancelled = err?.message?.includes('cancelled')
      setCreateError(
        err?.response?.data?.message ||
          (isSudoCancelled
            ? 'Action cancelled: Sudo elevation is required to create a new user.'
            : 'Failed to create user.')
      )
    } finally {
      setCreateLoading(false)
    }
  }

  // Edit Roles Handlers
  const openEditModal = (targetUser: UserItem) => {
    setUserToEdit(targetUser)
    setEditRoles(targetUser.roles || [])
    setEditError(null)
    setRoleSearchQuery('')
  }

  const toggleEditRole = (roleName: string) => {
    setEditRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    )
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userToEdit) return
    setEditError(null)
    setEditLoading(true)

    try {
      const res = await usersApi.updateUser(userToEdit.username, {
        roles: editRoles,
      })

      setUsers((prev) =>
        prev.map((item) =>
          item.id === userToEdit.id ? { ...item, ...res.data } : item
        )
      )

      setUserToEdit(null)
      toast.success(`Roles updated successfully for user '${userToEdit.username}'.`)
    } catch (err: any) {
      const isSudoCancelled = err?.message?.includes('cancelled')
      setEditError(
        err?.response?.data?.message ||
          (isSudoCancelled
            ? 'Action cancelled: Sudo elevation is required to update user roles.'
            : 'Failed to update user roles.')
      )
    } finally {
      setEditLoading(false)
    }
  }

  // Delete User Handlers
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    setDeleteLoading(true)

    try {
      await usersApi.deleteUser(userToDelete.username)
      setUsers((prev) =>
        prev.map((item) =>
          item.id === userToDelete.id ? { ...item, status: 'DELETED' } : item
        )
      )
      setUserToDelete(null)
    } catch (err: any) {
      const isSudoCancelled = err?.message?.includes('cancelled')
      const errorMsg =
        err?.response?.data?.message ||
        (isSudoCancelled
          ? `Action cancelled: Sudo elevation is required to delete user '${userToDelete.username}'.`
          : `Failed to delete user '${userToDelete.username}'.`)
      toast.error(errorMsg)
      setUserToDelete(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Calculate high-level stats
  const activeCount = useMemo(() => users.filter((u) => u.status === 'ACTIVE').length, [users])
  const inactiveCount = useMemo(() => users.filter((u) => u.status !== 'ACTIVE').length, [users])

  const startRecord = totalElements === 0 ? 0 : currentPage * pageSize + 1
  const endRecord = Math.min((currentPage + 1) * pageSize, totalElements)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Users Directory &amp; Access Control
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Enterprise user identities, hierarchical numeric levels, and granular capability assignments
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canRead && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers(currentPage, pageSize)}
              disabled={loading}
              className="gap-2 border-zinc-200 dark:border-zinc-800 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          )}

          {canCreate && (
            <Button
              size="sm"
              onClick={openCreateModal}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>New Enterprise User</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Counter Overview */}
      {canRead && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Total Accounts
              </p>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {fetchError ? '—' : totalElements}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Page Active (Enabled)
              </p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {fetchError ? '—' : activeCount}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Page Inactive / Deleted
              </p>
              <p className="text-xl sm:text-2xl font-bold text-zinc-600 dark:text-zinc-400 mt-0.5">
                {fetchError ? '—' : inactiveCount}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
              <Lock className="h-4 w-4" />
            </div>
          </div>
        </div>
      )}

      {/* Main Users Table Card */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Configured Enterprise Accounts</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Directory synchronized across Postgres and Redis role caches. Mutating accounts requires sudo elevation.
            </CardDescription>
          </div>

          {canRead && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                Rows per page:
              </span>
              <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-0.5 text-xs">
                {[10, 20, 50].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handlePageSizeChange(size)}
                    className={`px-2 py-0.5 rounded-md font-mono text-[11px] transition-colors cursor-pointer ${
                      pageSize === size
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-500">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-xs">Loading enterprise user directory...</p>
            </div>
          ) : fetchError ? (
            <div className="p-8 text-center space-y-3">
              <div className="h-10 w-10 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">
                {fetchError.message}
              </p>
              {canRead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(currentPage, pageSize)}
                  className="gap-2 cursor-pointer mt-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Retry Directory Request</span>
                </Button>
              )}
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800/60 mx-auto flex items-center justify-center text-zinc-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  No accounts found
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  No enterprise user accounts have been registered on this node.
                </p>
              </div>
              {canCreate && (
                <Button
                  size="sm"
                  onClick={openCreateModal}
                  className="gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create First User</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
              {users.map((item) => {
                const isSelf = item.id === user?.id
                const targetLevel = item.level ?? Infinity
                const isProtectedByHierarchy = targetLevel <= userLevel
                const isManageable = !isSelf && !isProtectedByHierarchy
                const isDeleted = item.status === 'DELETED'
                const isActive = item.status === 'ACTIVE'
                const isMutating = actionLoadingId === item.id

                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:px-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                      isDeleted ? 'opacity-60 bg-zinc-50/40 dark:bg-zinc-950/20' : ''
                    }`}
                  >
                    {/* Left: User Identity, Badges, Roles & Security */}
                    <div className="space-y-2 min-w-0 flex-1">
                      {/* Identity Row */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {item.username.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-zinc-900 dark:text-white text-xs sm:text-sm">
                            {item.full_name || item.fullName || item.username}
                          </span>

                          <span className="text-xs text-zinc-600 dark:text-zinc-300 font-mono font-medium">
                            @{item.username} • {item.email}
                          </span>

                          {isSelf && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 font-medium"
                            >
                              You
                            </Badge>
                          )}

                          {item.level !== undefined && item.level !== null && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 font-mono font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                            >
                              Level {item.level}
                            </Badge>
                          )}

                          {!isSelf && isProtectedByHierarchy && (
                            <Badge
                              variant="secondary"
                              title={`You cannot manage this user because their authority level (${targetLevel}) is equal or higher privilege than your level (${userLevel})`}
                              className="text-[10px] px-1.5 py-0.5 text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 gap-1 border border-zinc-200 dark:border-zinc-700 inline-flex items-center"
                            >
                              <Lock className="h-2.5 w-2.5" />
                              <span>Protected</span>
                            </Badge>
                          )}

                          {/* Status Badge */}
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : item.status === 'LOCKED' ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                              <Lock className="h-3 w-3" />
                              Locked
                            </span>
                          ) : isDeleted ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 line-through">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Deleted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Disabled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* User UUID */}
                      {item.id && (
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <span className="text-zinc-400 dark:text-zinc-500 font-sans text-[11px] font-medium">id:</span>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-200">{item.id}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.id)}
                            title="Copy user UUID"
                            className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors p-0.5 cursor-pointer inline-flex items-center"
                          >
                            {copiedId === item.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Roles & Security details */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-x-5 gap-y-2 pt-0.5 flex-wrap">
                        {/* Assigned Roles */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mr-1">
                            Roles ({item.roles?.length || 0}):
                          </span>
                          {item.roles && item.roles.length > 0 ? (
                            item.roles.map((r) => (
                              <Badge
                                key={r}
                                variant="outline"
                                className="text-[11px] px-2 py-0.5 font-mono font-medium text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                              >
                                {r.replace('ROLE_', '')}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 italic">No roles assigned</span>
                          )}
                        </div>

                        {/* Security / MFA */}
                        <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-300">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {Boolean(item.passkey_enabled ?? item.passkeyEnabled) && (
                              <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                                <Fingerprint className="h-3.5 w-3.5" /> Passkey
                              </span>
                            )}
                            {Boolean((item.mfa_enabled ?? item.mfaEnabled) || (item.sms_mfa_enabled ?? item.smsMfaEnabled)) && (
                              <span className="inline-flex items-center gap-1 font-medium text-purple-700 dark:text-purple-400">
                                <Shield className="h-3.5 w-3.5" /> MFA
                              </span>
                            )}
                            {Boolean(item.has_password ?? item.hasPassword) && (
                              <span className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                                <KeyRound className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" /> Password
                              </span>
                            )}
                            {!Boolean(item.passkey_enabled ?? item.passkeyEnabled) &&
                              !Boolean(item.mfa_enabled ?? item.mfaEnabled) &&
                              !Boolean(item.sms_mfa_enabled ?? item.smsMfaEnabled) &&
                              !Boolean(item.has_password ?? item.hasPassword) && (
                                <span className="text-zinc-500 dark:text-zinc-400 font-medium italic">
                                  {Boolean(item.has_social_accounts ?? item.hasSocialAccounts) ? 'OAuth / Social only' : 'No credentials set'}
                                </span>
                              )}
                          </div>

                          <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">•</span>

                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                            <span className={(item.email_verified ?? item.emailVerified) ? 'font-medium text-zinc-700 dark:text-zinc-200' : 'text-zinc-500 dark:text-zinc-400'}>
                              {(item.email_verified ?? item.emailVerified) ? 'Verified' : 'Unverified'}
                            </span>
                          </div>

                          {(item.created_at || item.createdAt) && (
                            <>
                              <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">•</span>
                              <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">
                                Created {new Date(item.created_at || item.createdAt!).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center flex-wrap">
                      {isDeleted ? (
                        canRestore && isManageable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreUser(item)}
                            disabled={isMutating}
                            title="Restore account to DISABLED state"
                            className="h-8 text-xs px-2.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 gap-1.5 border-blue-200 dark:border-blue-900/50 cursor-pointer font-medium"
                          >
                            {isMutating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" />
                            )}
                            <span>Restore</span>
                          </Button>
                        )
                      ) : (
                        isManageable && (
                          <>
                            {/* Edit Roles Button */}
                            {canUpdate && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(item)}
                                disabled={isMutating}
                                title="Edit assigned roles"
                                className="h-8 text-xs px-2.5 gap-1.5 cursor-pointer font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                              >
                                <Edit3 className="h-3.5 w-3.5 text-zinc-500" />
                                <span>Roles</span>
                              </Button>
                            )}

                            {/* Enable / Disable Toggle */}
                            {canUpdate && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(item)}
                                disabled={isMutating}
                                title={isActive ? 'Disable user and revoke active tokens' : 'Enable user account'}
                                className={`h-8 text-xs px-2.5 gap-1.5 font-medium cursor-pointer transition-all ${
                                  isActive
                                    ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                                    : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                                }`}
                              >
                                {isMutating ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Power className="h-3.5 w-3.5" />
                                )}
                                <span>{isActive ? 'Disable' : 'Enable'}</span>
                              </Button>
                            )}

                            {/* Delete Button */}
                            {canDelete && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setUserToDelete(item)}
                                disabled={isMutating}
                                title="Soft-delete account"
                                className="h-8 text-xs px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 gap-1.5 cursor-pointer font-medium"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete</span>
                              </Button>
                            )}
                          </>
                        )
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && !fetchError && totalElements > 0 && (
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500">
              <div>
                Showing <span className="font-semibold text-zinc-800 dark:text-zinc-200">{startRecord}</span> to{' '}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{endRecord}</span> of{' '}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{totalElements}</span> accounts
              </div>

              <div className="flex items-center gap-2 self-center sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={isFirst}
                  className="h-7 text-xs px-2 gap-1 cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>

                <div className="text-[11px] font-mono px-2">
                  Page {currentPage + 1} of {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={isLast}
                  className="h-7 text-xs px-2 gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: Create New Enterprise User */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Register Enterprise Account
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Creates an active identity. Initial credentials are configured via password reset.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  placeholder="e.g. john.doe or jdoe"
                  disabled={createLoading}
                  className="font-mono text-xs"
                  required
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Must be alphanumeric with single periods or underscores.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Corporate Email <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="e.g. john.doe@vaultix.io"
                  disabled={createLoading}
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Full Name (Optional)
                </label>
                <Input
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  disabled={createLoading}
                  className="text-xs"
                />
              </div>

              {/* Role Assignment Picker */}
              <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Assign Roles (Numeric Authority &gt; {userLevel})
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {createRoles.length} selected
                  </span>
                </div>

                {/* Role search filter input */}
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
                  <Input
                    value={roleSearchQuery}
                    onChange={(e) => handleRoleSearchChange(e.target.value)}
                    placeholder="Search roles by name (e.g. billing, operator)..."
                    disabled={createLoading}
                    className="pl-8 text-xs h-8"
                  />
                  {searchingRoles && (
                    <Loader2 className="h-3 w-3 animate-spin absolute right-2.5 top-2.5 text-zinc-400" />
                  )}
                </div>

                {/* Role Selection Chips */}
                <div className="max-h-40 overflow-y-auto p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-wrap gap-1.5">
                  {availableRoles.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-2 px-1">
                      {searchingRoles ? 'Searching roles...' : 'No assignable roles found.'}
                    </p>
                  ) : (
                    availableRoles.map((role) => {
                      const isSelected = createRoles.includes(role.name)
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => toggleCreateRole(role.name)}
                          className={cn(
                            'text-xs px-2.5 py-1 rounded-lg border font-mono transition-all flex items-center gap-1.5 cursor-pointer',
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-blue-400'
                          )}
                        >
                          <span>{role.name}</span>
                          <span
                            className={cn(
                              'text-[10px] px-1 py-0 rounded',
                              isSelected ? 'bg-blue-700 text-blue-100' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'
                            )}
                          >
                            Lvl {role.level}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createLoading}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createLoading}
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create User</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit User Roles */}
      {userToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Edit3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Modify User Roles
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    Update role assignments for <span className="font-semibold text-zinc-900 dark:text-white">@{userToEdit.username}</span> ({userToEdit.email})
                  </p>
                  <p className="text-xs font-mono text-zinc-600 dark:text-zinc-300 pt-0.5">
                    <span className="text-zinc-400 dark:text-zinc-500 font-sans text-[11px] font-medium">ID:</span>{' '}
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">{userToEdit.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserToEdit(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Role search filter input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                  Assignable Roles (Authority Level &gt; {userLevel})
                </label>
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
                  <Input
                    value={roleSearchQuery}
                    onChange={(e) => handleRoleSearchChange(e.target.value)}
                    placeholder="Search roles (e.g. operator, audit)..."
                    disabled={editLoading}
                    className="pl-8 text-xs h-8"
                  />
                  {searchingRoles && (
                    <Loader2 className="h-3 w-3 animate-spin absolute right-2.5 top-2.5 text-zinc-400" />
                  )}
                </div>

                {/* Role selection chips */}
                <div className="max-h-48 overflow-y-auto p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-wrap gap-1.5">
                  {/* Show already assigned roles + available roles */}
                  {Array.from(new Set([...editRoles, ...availableRoles.map((r) => r.name)])).map((roleName) => {
                    const isSelected = editRoles.includes(roleName)
                    const roleMeta = availableRoles.find((r) => r.name === roleName)

                    return (
                      <button
                        key={roleName}
                        type="button"
                        onClick={() => toggleEditRole(roleName)}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-lg border font-mono transition-all flex items-center gap-1.5 cursor-pointer',
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-blue-400'
                        )}
                      >
                        <span>{roleName}</span>
                        {roleMeta?.level && (
                          <span
                            className={cn(
                              'text-[10px] px-1 py-0 rounded',
                              isSelected ? 'bg-blue-700 text-blue-100' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'
                            )}
                          >
                            Lvl {roleMeta.level}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUserToEdit(null)}
                  disabled={editLoading}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={editLoading}
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Role Assignments</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Delete Account: @{userToDelete.username}
                </h3>
                <p className="text-xs font-mono text-zinc-600 dark:text-zinc-300 pt-0.5">
                  <span className="text-zinc-400 dark:text-zinc-500 font-sans text-[11px] font-medium">ID:</span>{' '}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">{userToDelete.id}</span>
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Are you sure you want to soft-delete this user?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Immediate Session Revocation:
              </p>
              <p className="text-[11px] leading-relaxed">
                All active access tokens, refresh tokens, and authentication sessions associated with this account will be permanently revoked immediately.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUserToDelete(null)}
                disabled={deleteLoading}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 cursor-pointer"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete User</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
