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

  const data = useMemo(() => {
    const combined = [...(a0.data ?? []), ...(a1.data ?? [])]
    return combined
      .sort((a, b) => b.ts - a.ts)
      .slice(0, limit) as ActionLog[]
  }, [a0.data, a1.data, limit])

  return {
    data,
    isLoading: agents.isLoading || a0.isLoading,
    isError: a0.isError && a1.isError,
  }
}

export default function DashboardPage() {
  const stats = useStats()
  const activity = useAllActivity(10)

  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-mono font-light tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Live view of all agent activity</p>
        </div>
        <div className="flex items-center gap-2">
          <NetworkBadge network="testnet" />
          <NetworkBadge network="mainnet" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          label="Agents"
          value={stats.data?.totalAgents ?? 0}
          loading={stats.isLoading}
          sublabel="registered"
        />
        <StatsCard
          label="Sessions"
          value={stats.data?.totalSessions ?? 0}
          loading={stats.isLoading}
          sublabel="total"
        />
        <StatsCard
          label="Actions"
          value={stats.data?.totalActions ?? 0}
          loading={stats.isLoading}
          sublabel="logged"
        />
        <StatsCard
          label="Anchors"
          value={stats.data?.totalAnchors ?? 0}
          loading={stats.isLoading}
          sublabel="on-chain"
        />
      </div>

      {/* Activity feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-foreground uppercase tracking-widest">
            Recent Activity
          </h2>
          <Link
            href="/agents"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all agents
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm divide-y divide-border">
          {activity.isLoading && (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-48 rounded" />
                <Skeleton className="h-3 w-24 rounded ml-auto" />
              </div>
            ))
          )}

          {activity.isError && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Could not load activity — is the backend running?
            </div>
          )}

          {activity.data?.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No actions yet. Run{" "}
              <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">npm run demo</code>{" "}
              in the backend to generate activity.
            </div>
          )}

          {activity.data?.map((action) => (
            <div key={action.id} className="px-4 py-3 flex items-center gap-3">
              <ActionTypeIcon type={action.actionType} className="shrink-0" />
              <span className="text-sm text-foreground flex-1 min-w-0 truncate">
                {action.description}
              </span>
              <div className="shrink-0 flex items-center gap-2">
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
