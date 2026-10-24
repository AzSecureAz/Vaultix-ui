import { useState, useEffect } from 'react'
import { ShieldCheck, Plus, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'

interface RoleItem {
  id: string
  name: string
  description?: string
  hierarchy_level: number
  permissions?: string[]
}

export function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/auth/admin/roles?size=20')
      if (res.data?.success && res.data?.data?.content) {
        setRoles(res.data.data.content)
      }
    } catch {
      // Fallback preview
      setRoles([
        {
          id: '1',
          name: 'ROLE_SUPER_ADMIN',
          description: 'Full administrative rights with Level 100 control',
          hierarchy_level: 100,
          permissions: ['*'],
        },
        {
          id: '2',
          name: 'ROLE_ADMIN',
          description: 'Security & User Governance',
          hierarchy_level: 50,
          permissions: ['users:read', 'users:write', 'keys:read'],
        },
        {
          id: '3',
          name: 'ROLE_USER',
          description: 'Standard enterprise authenticated principal',
          hierarchy_level: 10,
          permissions: ['profile:read', 'profile:write'],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Hierarchical RBAC Governance
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Hierarchical numeric levels with dynamic Redis permission cache invalidation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRoles}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Define New Role</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {roles.map((r) => (
          <Card key={r.id} className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="default" className="text-xs font-mono">
                  Level {r.hierarchy_level}
                </Badge>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">ID: {r.id.slice(0, 8)}</span>
              </div>
              <CardTitle className="text-base text-zinc-900 dark:text-white">{r.name}</CardTitle>
              <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {r.description || 'Enterprise role definition'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
                  Assigned Permissions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {r.permissions?.map((p) => (
                    <Badge key={p} variant="secondary" className="text-[10px] font-mono">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
