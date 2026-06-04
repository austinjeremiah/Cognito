"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useMemo } from "react"
import { useStats } from "@/hooks/useStats"
import { useActionHistory } from "@/hooks/useActionHistory"
import { useAgents } from "@/hooks/useAgents"
import { StatsCard } from "@/components/cognito/StatsCard"
import { NetworkBadge } from "@/components/cognito/NetworkBadge"
import { ActionTypeIcon } from "@/components/cognito/ActionTypeIcon"
import { BlobLink } from "@/components/cognito/BlobLink"
import { Skeleton } from "@/components/ui/skeleton"
import type { ActionLog } from "@/app/types"

function useAllActivity(limit: number) {
  const agents = useAgents()
  const a0 = useActionHistory(agents.data?.[0]?.id, limit)
  const a1 = useActionHistory(agents.data?.[1]?.id, limit)
  const a2 = useActionHistory(agents.data?.[2]?.id, limit)

  const data = useMemo(() => {
    const combined = [...(a0.data ?? []), ...(a1.data ?? []), ...(a2.data ?? [])]
    return combined.sort((a, b) => b.ts - a.ts).slice(0, limit) as ActionLog[]
  }, [a0.data, a1.data, a2.data, limit])

  return { data, isLoading: agents.isLoading || a0.isLoading, isError: a0.isError && a1.isError }
}

export default function DashboardPage() {
  const stats = useStats()
  const activity = useAllActivity(15)
  const agents = useAgents()

  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-mono font-light tracking-tight text-foreground">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-sm text-muted-foreground">Live · refreshing every 10s</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NetworkBadge network="testnet" />
          <NetworkBadge network="mainnet" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard label="Agents" value={stats.data?.totalAgents ?? 0} loading={stats.isLoading} sublabel="registered" accent="blue" />
        <StatsCard label="Sessions" value={stats.data?.totalSessions ?? 0} loading={stats.isLoading} sublabel="total" accent="purple" />
        <StatsCard label="Actions" value={stats.data?.totalActions ?? 0} loading={stats.isLoading} sublabel="logged" accent="gold" />
        <StatsCard label="Anchors" value={stats.data?.totalAnchors ?? 0} loading={stats.isLoading} sublabel="on-chain" accent="green" />
      </div>

      {/* Agents quick access */}
      {agents.data && agents.data.length > 0 && (
        <div>
          <h2 className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-3">Active Agents</h2>
          <div className="flex flex-wrap gap-2">
            {agents.data.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-card/50 hover:bg-card hover:border-border text-sm font-mono text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {agent.name ?? agent.id}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Activity feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Recent Activity</h2>
          <Link href="/agents" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View all agents →
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm overflow-hidden divide-y divide-border/50">
          {activity.isLoading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-3">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-64 rounded" />
              <Skeleton className="h-3 w-16 rounded ml-auto" />
            </div>
          ))}

          {activity.isError && (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              Could not load activity — is the backend running?
            </div>
          )}

          {!activity.isLoading && activity.data?.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No actions yet. Run <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">npm run demo</code> to generate activity.
            </div>
          )}

          {activity.data?.map((action) => (
            <div key={action.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-muted/20 transition-colors group">
              <ActionTypeIcon type={action.actionType} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{action.description}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{action.agentId}</p>
              </div>
              <div className="shrink-0 flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                {action.blobId && <BlobLink blobId={action.blobId} />}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(action.ts), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
