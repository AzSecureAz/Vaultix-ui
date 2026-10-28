import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShieldCheck,
  Shield,
  Plus,
  RefreshCw,
  Loader2,
  AlertCircle,
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
  Layers,
  Check,
  Copy,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { rolesApi, type RoleItem } from './api/rolesApi'
import { cn } from '@/lib/utils'

export function RolesPage() {
  const { user, hasPermission } = useAuthStore()
  const canRead = hasPermission('role:read')
  const canCreate = hasPermission('role:create')
  const canUpdate = hasPermission('role:update')
  const canDelete = hasPermission('role:delete')
  const canRestore = hasPermission('role:restore')

  // User's active level (lower numeric level = higher privilege)
  const userLevel = user?.level ?? Infinity

  const [roles, setRoles] = useState<RoleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [fetchError, setFetchError] = useState<{ status?: number; message: string } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(text)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const [searchParams, setSearchParams] = useSearchParams()

  // 1-indexed for users in URL (?page=1, ?page=5)
  const rawPage = parseInt(searchParams.get('page') || '1', 10)
  const rawSize = parseInt(searchParams.get('size') || '10', 10)

  const currentPage = isNaN(rawPage) || rawPage < 1 ? 0 : rawPage - 1
  const pageSize = [10, 20, 50].includes(rawSize) ? rawSize : 10

  // Server-side pagination metadata
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isFirst, setIsFirst] = useState(true)
  const [isLast, setIsLast] = useState(true)

  // Modals & form state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createLevel, setCreateLevel] = useState<string>('')
  const [createPermissions, setCreatePermissions] = useState<string[]>([])
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [roleToEdit, setRoleToEdit] = useState<RoleItem | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editLevel, setEditLevel] = useState<string>('')
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [roleToDelete, setRoleToDelete] = useState<RoleItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Permissions available to assign when creating a role (actor's own possessed permissions)
  const availableCreatePermissions = useMemo(() => {
    return [...(user?.permissions || [])].sort()
  }, [user?.permissions])

  // Permissions available when editing a role (actor's permissions UNION existing permissions on the role)
  const availableEditPermissions = useMemo(() => {
    const set = new Set<string>([
      ...(user?.permissions || []),
      ...(roleToEdit?.permissions || []),
    ])
    return Array.from(set).sort()
  }, [user?.permissions, roleToEdit?.permissions])

  const toggleCreatePermission = (perm: string) => {
    setCreatePermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  const toggleEditPermission = (perm: string) => {
    setEditPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  const fetchRoles = async (page = currentPage, size = pageSize) => {
    if (!canRead) {
      setLoading(false)
      setFetchError({
        status: 403,
        message: 'Access denied: You do not have permission to view roles (requires role:read).',
      })
      setRoles([])
      setTotalElements(0)
      setTotalPages(1)
      setIsFirst(true)
      setIsLast(true)
      return
    }

    setLoading(true)
    setBannerMessage(null)
    setFetchError(null)

    try {
      const res = await rolesApi.getRoles(page, size)
      if (res.success && res.data) {
        setFetchError(null)
        const data = res.data
        const items = data.content || []
        setRoles(items)

        const pageInfo = data.page
        const total = pageInfo?.total_elements ?? data.total_elements ?? data.totalElements ?? items.length
        const pages = pageInfo?.total_pages ?? data.total_pages ?? data.totalPages ?? Math.max(1, Math.ceil(total / size))
        const pageNum = pageInfo?.number ?? data.number ?? page

        setTotalElements(total)
        setTotalPages(pages)
        setIsFirst(pageNum === 0)
        setIsLast(pageNum >= pages - 1)

        // Auto-correct page if query param exceeds total pages
        if (page >= pages && pages > 0) {
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.set('page', String(pages))
            next.set('size', String(size))
            return next
          }, { replace: true })
        }
      } else {
        const errorMsg = res.message || 'Failed to retrieve system roles.'
        setFetchError({ message: errorMsg })
        setRoles([])
        setTotalElements(0)
        setTotalPages(1)
        setIsFirst(true)
        setIsLast(true)
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to retrieve system roles.'
      const status = err?.response?.status

      setFetchError({
        message: errorMsg,
        status,
      })
      setRoles([])
      setTotalElements(0)
      setTotalPages(1)
      setIsFirst(true)
      setIsLast(true)
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    fetchRoles(currentPage, pageSize)
  }, [currentPage, pageSize, canRead])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages && !loading) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', String(newPage + 1))
        next.set('size', String(pageSize))
        return next
      })
    }
  }

  const handlePageSizeChange = (newSize: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      next.set('size', String(newSize))
      return next
    })
  }

  // Toggle Role Status (ENABLE / DISABLE)
  const handleToggleStatus = async (role: RoleItem) => {
    if (!canUpdate || actionLoadingId || role.status === 'DELETED') return
    if (role.level <= userLevel) {
      setBannerMessage({
        text: `Hierarchy restriction: You cannot modify role '${role.name}' (level ${role.level} is equal or higher privilege than your level ${userLevel}).`,
        type: 'error',
      })
      return
    }

    const isCurrentlyEnabled = role.status === 'ENABLED'
    const action = isCurrentlyEnabled ? 'disable' : 'enable'

    setActionLoadingId(role.id)
    setBannerMessage(null)

    try {
      if (isCurrentlyEnabled) {
        await rolesApi.disableRole(role.name)
        setBannerMessage({ text: `Role '${role.name}' has been disabled. Associated active user tokens have been revoked.`, type: 'success' })
      } else {
        await rolesApi.enableRole(role.name)
        setBannerMessage({ text: `Role '${role.name}' has been enabled.`, type: 'success' })
      }

      setRoles((prev) =>
        prev.map((item) =>
          item.id === role.id
            ? { ...item, status: isCurrentlyEnabled ? 'DISABLED' : 'ENABLED' }
            : item
        )
      )
    } catch (err: any) {
      const isSudoCancelled = err?.message?.includes('cancelled')
      setBannerMessage({
        text:
          err?.response?.data?.message ||
          (isSudoCancelled
            ? `Action cancelled: Sudo elevation is required to ${action} role '${role.name}'.`
            : `Failed to ${action} role '${role.name}'.`),
        type: 'error',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  // Restore Soft-Deleted Role
  const handleRestoreRole = async (role: RoleItem) => {
    if (!canRestore || actionLoadingId || role.status !== 'DELETED') return
    if (role.level <= userLevel) {
      setBannerMessage({
        text: `Hierarchy restriction: Cannot restore role '${role.name}' with level ${role.level}.`,
        type: 'error',
      })
      return
    }

    setActionLoadingId(role.id)
    setBannerMessage(null)

    try {
      await rolesApi.restoreRole(role.name)
      setBannerMessage({ text: `Role '${role.name}' has been restored to DISABLED state.`, type: 'success' })
      setRoles((prev) =>
        prev.map((item) =>
          item.id === role.id ? { ...item, status: 'DISABLED' } : item
        )
      )
    } catch (err: any) {
      const isSudoCancelled = err?.message?.includes('cancelled')
      setBannerMessage({
        text:
          err?.response?.data?.message ||
          (isSudoCancelled
            ? `Action cancelled: Sudo elevation is required to restore role '${role.name}'.`
            : `Failed to restore role '${role.name}'.`),
        type: 'error',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  // Create Role Handlers
  const openCreateModal = () => {
    setCreateName('')
    setCreateDescription('')
    const defaultLevel = userLevel < 9999 ? userLevel + 10 : 1000
    setCreateLevel(String(defaultLevel))
    setCreatePermissions([])
    setCreateError(null)
    setIsCreateOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)

    const rawName = createName.trim()
    if (!rawName) {
      setCreateError('Role name is required.')
      return
    }

    const lvl = parseInt(createLevel, 10)
    if (isNaN(lvl) || lvl < 1) {
      setCreateError('Role level must be a positive integer.')
      return
    }

    if (lvl <= userLevel) {
      setCreateError(`Role level must be strictly greater than your active level (${userLevel}). Lower numbers indicate higher privilege.`)
      return
    }

    setCreateLoading(true)

    try {
      const upper = rawName.toUpperCase()
      const canonicalName = upper.startsWith('ROLE_') ? upper : `ROLE_${upper}`

      await rolesApi.createRole({
        name: canonicalName,
        description: createDescription.trim() || undefined,
        level: lvl,
        permissions: createPermissions,
      })

      setIsCreateOpen(false)
      setBannerMessage({ text: `Role '${canonicalName}' (Level ${lvl}) created successfully.`, type: 'success' })
      if (canRead) {
        fetchRoles(currentPage, pageSize)
      }
    } catch (err: any) {
      const isSudoCancelled = err?.message?.includes('cancelled')
      setCreateError(
        err?.response?.data?.message ||
        (isSudoCancelled
          ? 'Action cancelled: Sudo elevation is required to create a new role.'
          : 'Failed to create role.')
      )
    } finally {
      setCreateLoading(false)
    }
  }

  // Edit Role Handlers
  const openEditModal = (role: RoleItem) => {
    setRoleToEdit(role)
    setEditDescription(role.description || '')
    setEditLevel(String(role.level))
    setEditPermissions(role.permissions || [])
    setEditError(null)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleToEdit) return
    setEditError(null)

    const lvl = parseInt(editLevel, 10)
    if (isNaN(lvl) || lvl < 1) {
      setEditError('Role level must be a positive integer.')
      return
    }

    if (lvl <= userLevel) {
      setEditError(`Role level must be strictly greater than your active level (${userLevel}).`)
      return
    }

    setEditLoading(true)

    try {
      const updated = await rolesApi.updateRole(roleToEdit.name, {
        description: editDescription.trim() || undefined,
        level: lvl,
        permissions: editPermissions,
      })

      setRoles((prev) =>
        prev.map((item) =>
          item.id === roleToEdit.id ? { ...item, ...updated.data } : item
        )
      )

      setRoleToEdit(null)
      setBannerMessage({ text: `Role '${roleToEdit.name}' updated successfully.`, type: 'success' })
    } catch (err: any) {
      const isSudoCancelled = err?.message?.includes('cancelled')
      setEditError(
        err?.response?.data?.message ||
        (isSudoCancelled
          ? 'Action cancelled: Sudo elevation is required to update this role.'
          : 'Failed to update role.')
      )
    } finally {
      setEditLoading(false)
    }
  }

  // Delete Role Handlers
  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return
    setDeleteLoading(true)

    try {
      await rolesApi.deleteRole(roleToDelete.name)
      setBannerMessage({
        text: `Role '${roleToDelete.name}' has been soft-deleted. User sessions with this role have been revoked.`,
        type: 'success',
      })
      setRoles((prev) =>
        prev.map((item) =>
          item.id === roleToDelete.id ? { ...item, status: 'DELETED' } : item
        )
      )
      setRoleToDelete(null)
    } catch (err: any) {
      const isSudoCancelled = err?.message?.includes('cancelled')
      setBannerMessage({
        text:
          err?.response?.data?.message ||
          (isSudoCancelled
            ? `Action cancelled: Sudo elevation is required to delete role '${roleToDelete.name}'.`
            : `Failed to delete role '${roleToDelete.name}'.`),
        type: 'error',
      })
      setRoleToDelete(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const enabledCount = roles.filter((r) => r.status === 'ENABLED').length
  const inactiveCount = roles.filter((r) => r.status !== 'ENABLED').length

  const startRecord = totalElements === 0 ? 0 : currentPage * pageSize + 1
  const endRecord = Math.min((currentPage + 1) * pageSize, totalElements)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Role &amp; RBAC Governance
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Hierarchical numeric authority levels and granular capability assignments
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRoles(currentPage, pageSize)}
            disabled={loading || !canRead}
            className="h-9 gap-2 text-xs font-medium cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={openCreateModal}
            disabled={createLoading || !canCreate}
            title={!canCreate ? 'Insufficient permission: requires role:create' : 'Define and configure a new system role'}
            className={cn(
              'h-9 gap-2 text-xs font-medium shadow-xs transition-all',
              canCreate
                ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                : 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700'
            )}
          >
            <Plus className="h-4 w-4" />
            <span>Define New Role</span>
          </Button>
        </div>
      </div>

      {/* Banner Feedback */}
      {bannerMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-red-500/10 text-red-800 dark:text-red-300 border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Stats Counter Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Total Roles
            </p>
            <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {fetchError ? '—' : totalElements}
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
            <Layers className="h-4 w-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Active Roles (Enabled)
            </p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {fetchError ? '0' : enabledCount}
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Inactive / Deleted
            </p>
            <p className="text-xl sm:text-2xl font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">
              {fetchError ? '0' : inactiveCount}
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
            <Shield className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Roles List Card */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>Configured System Roles</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {canUpdate || canCreate || canDelete
                ? 'Hierarchical numeric level controls and capability assignments. Sudo elevation required for mutations.'
                : 'Read-only view of configured system roles and privilege levels.'}
            </CardDescription>
          </div>

          {/* Rows per page selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              Rows per page:
            </span>
            <div className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-50 dark:bg-zinc-900/80">
              {[10, 20, 50].map((sizeOption) => (
                <button
                  key={sizeOption}
                  type="button"
                  onClick={() => handlePageSizeChange(sizeOption)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    pageSize === sizeOption
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {sizeOption}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {fetchError ? (
            <div className="py-14 px-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 mb-3 shadow-xs">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {fetchError.status === 403 ? 'Access Restricted' : 'Unable to Retrieve Roles'}
              </h3>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                {fetchError.message}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {fetchError.status !== 403 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchRoles(currentPage, pageSize)}
                    className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retry</span>
                  </Button>
                )}
              </div>
            </div>
          ) : loading && roles.length === 0 ? (
            <div className="py-14 text-center text-zinc-500 text-xs">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                <span>Loading roles...</span>
              </div>
            </div>
          ) : roles.length === 0 ? (
            <div className="py-14 text-center text-zinc-500 dark:text-zinc-400 text-xs">
              No roles found.
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
              {roles.map((role) => {
                const isEnabled = role.status === 'ENABLED'
                const isDisabled = role.status === 'DISABLED'
                const isDeleted = role.status === 'DELETED'
                const isBusy = actionLoadingId === role.id
                const isManageable = role.level > userLevel

                return (
                  <div
                    key={role.id || role.name}
                    className="p-4 sm:px-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
                  >
                    <div className="space-y-2 min-w-0 flex-1">
                      {/* Name, Level, Status Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                          {role.name}
                        </span>

                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0.5 font-mono font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                        >
                          Level {role.level}
                        </Badge>

                        {isEnabled && (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30 text-[10px] font-semibold gap-1 px-2 py-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ENABLED
                          </Badge>
                        )}

                        {isDisabled && (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 border-amber-500/30 text-[10px] font-semibold px-2 py-0.5">
                            DISABLED
                          </Badge>
                        )}

                        {isDeleted && (
                          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 hover:bg-rose-500/25 border-rose-500/30 text-[10px] font-semibold line-through px-2 py-0.5">
                            DELETED
                          </Badge>
                        )}

                        {!isManageable && (
                          <Badge
                            variant="secondary"
                            title={`You cannot modify this role because its authority level (${role.level}) is equal or higher privilege than your level (${userLevel})`}
                            className="text-[10px] px-1.5 py-0.5 text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 gap-1"
                          >
                            <Lock className="h-2.5 w-2.5" />
                            <span>Protected</span>
                          </Badge>
                        )}
                      </div>

                      {/* Role UUID */}
                      {role.id && (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                          <span>id: {role.id}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(role.id)}
                            title="Copy role UUID"
                            className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-0.5 cursor-pointer inline-flex items-center"
                          >
                            {copiedId === role.id ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {role.description || 'Enterprise role definition.'}
                      </p>

                      {/* Permissions List */}
                      <div className="pt-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mr-1">
                            Capabilities ({role.permissions?.length || 0}):
                          </span>
                          {role.permissions && role.permissions.length > 0 ? (
                            role.permissions.map((perm) => (
                              <Badge
                                key={perm}
                                variant="outline"
                                className="text-[10px] font-mono px-1.5 py-0 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800"
                              >
                                {perm}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[11px] text-zinc-400 italic">No assigned permissions</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center flex-wrap">
                      {/* Edit Button */}
                      {!isDeleted && canUpdate && isManageable && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(role)}
                          disabled={isBusy}
                          className="h-8 text-xs gap-1.5 cursor-pointer font-medium"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-zinc-500" />
                          <span>Edit</span>
                        </Button>
                      )}

                      {/* Enable / Disable Button */}
                      {!isDeleted && canUpdate && isManageable && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(role)}
                          disabled={isBusy}
                          className={cn(
                            'h-8 text-xs gap-1.5 cursor-pointer font-medium',
                            isEnabled
                              ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border-amber-200 dark:border-amber-800/60'
                              : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800/60'
                          )}
                        >
                          {isBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Power className="h-3.5 w-3.5" />
                          )}
                          <span>{isEnabled ? 'Disable' : 'Enable'}</span>
                        </Button>
                      )}

                      {/* Delete Button */}
                      {!isDeleted && canDelete && isManageable && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setRoleToDelete(role)}
                          disabled={isBusy}
                          className="h-8 text-xs gap-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-900/60 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </Button>
                      )}

                      {/* Restore Button */}
                      {isDeleted && canRestore && isManageable && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreRole(role)}
                          disabled={isBusy}
                          className="h-8 text-xs gap-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 cursor-pointer font-medium"
                        >
                          {isBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          <span>Restore</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Bottom Pagination Bar */}
          {!fetchError && totalElements > 0 && (
            <div className="p-3.5 sm:px-6 border-t border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-zinc-500 dark:text-zinc-400 text-xs">
                Showing <span className="font-semibold text-zinc-900 dark:text-zinc-100">{startRecord}</span> to{' '}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{endRecord}</span> of{' '}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalElements}</span> roles
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mr-1">
                  Page {currentPage + 1} of {Math.max(1, totalPages)}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={isFirst || loading}
                    className="h-8 px-2.5 text-xs cursor-pointer gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Prev</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={isLast || loading}
                    className="h-8 px-2.5 text-xs cursor-pointer gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Define New Role */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Define New System Role
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Create a role with hierarchical numeric authority and assigned capabilities
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. OPERATOR or ROLE_OPERATOR"
                  className="font-mono text-xs uppercase"
                  required
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Standard format: alphanumeric with single underscores. Will be automatically prefixed with <code>ROLE_</code>.
                </p>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Hierarchy Authority Level <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="99999"
                  value={createLevel}
                  onChange={(e) => setCreateLevel(e.target.value)}
                  placeholder={`Must be > ${userLevel}`}
                  className="font-mono text-xs"
                  required
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Lower numbers represent higher privilege. Must be strictly greater than your level ({userLevel}).
                </p>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <Input
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Operational responsibilities and scope"
                  maxLength={256}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Assigned Permissions
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Selected: {createPermissions.length} / {availableCreatePermissions.length}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mb-2">
                  Select permissions to grant to this role from your account capabilities:
                </p>

                {availableCreatePermissions.length === 0 ? (
                  <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30 text-zinc-400 text-center italic">
                    You do not currently possess any assignable permissions.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
                    {availableCreatePermissions.map((perm) => {
                      const isSelected = createPermissions.includes(perm)
                      return (
                        <button
                          key={perm}
                          type="button"
                          onClick={() => toggleCreatePermission(perm)}
                          className={cn(
                            'text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5',
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 font-semibold shadow-xs'
                              : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-purple-400'
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                          <span>{perm}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createLoading}
                  className="h-9 text-xs cursor-pointer"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={createLoading}
                  className="h-9 text-xs bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Role</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Role */}
      {roleToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Update Role: {roleToEdit.name}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    ID: {roleToEdit.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRoleToEdit(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Hierarchy Authority Level <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="99999"
                  value={editLevel}
                  onChange={(e) => setEditLevel(e.target.value)}
                  placeholder={`Must be > ${userLevel}`}
                  className="font-mono text-xs"
                  required
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Must be strictly greater than your level ({userLevel}).
                </p>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Role description"
                  maxLength={256}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Assigned Permissions
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Selected: {editPermissions.length} / {availableEditPermissions.length}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mb-2">
                  Toggle capabilities (includes currently assigned and your available permissions):
                </p>

                {availableEditPermissions.length === 0 ? (
                  <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30 text-zinc-400 text-center italic">
                    No assignable permissions available.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
                    {availableEditPermissions.map((perm) => {
                      const isSelected = editPermissions.includes(perm)
                      return (
                        <button
                          key={perm}
                          type="button"
                          onClick={() => toggleEditPermission(perm)}
                          className={cn(
                            'text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5',
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 font-semibold shadow-xs'
                              : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-purple-400'
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                          <span>{perm}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRoleToEdit(null)}
                  disabled={editLoading}
                  className="h-9 text-xs cursor-pointer"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={editLoading}
                  className="h-9 text-xs bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Delete Role
                </h3>
                <p className="text-xs text-zinc-500">
                  This action marks the role as DELETED and requires Sudo elevation.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-800 dark:text-red-300 space-y-1.5 leading-relaxed">
              <p className="font-semibold">Security Warning:</p>
              <p>
                Deleting role <span className="font-mono font-bold">{roleToDelete.name}</span> will broadcast a revocation event via Redis. Active user tokens holding this role will be revoked upon next authentication check.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRoleToDelete(null)}
                disabled={deleteLoading}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="h-8 text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
