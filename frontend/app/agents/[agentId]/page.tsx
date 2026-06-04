"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { useActionHistory } from "@/hooks/useActionHistory"
import { ActionEntry } from "@/components/cognito/ActionEntry"
import { SessionCard } from "@/components/cognito/SessionCard"
import { AgentBadge } from "@/components/cognito/AgentBadge"
import { MemoryPanel } from "@/components/cognito/MemoryPanel"
import { Skeleton } from "@/components/ui/skeleton"
import type { Session } from "@/app/types"

type Tab = "timeline" | "sessions" | "memory"

function deriveSessionsFromHistory(actions: ReturnType<typeof useActionHistory>["data"]): Session[] {
  if (!actions) return []
  const map = new Map<string, Session>()
  for (const a of actions) {
    if (!map.has(a.sessionId)) {
      map.set(a.sessionId, {
        id: a.sessionId,
        agentId: a.agentId,
        startedAt: a.ts,
        actionCount: 0,
        blobId: a.blobId,
      })
    }
    const s = map.get(a.sessionId)!
    s.actionCount += 1
    if (a.ts < s.startedAt) s.startedAt = a.ts
    if (!s.blobId && a.blobId) s.blobId = a.blobId
  }
  return Array.from(map.values()).sort((a, b) => b.startedAt - a.startedAt)
}

export default function AgentDetailPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params)
  const [tab, setTab] = useState<Tab>("timeline")
  const TABS: Tab[] = ["timeline", "sessions", "memory"]
  const { data: actions, isLoading } = useActionHistory(agentId, 100)

  const sessions = useMemo(() => deriveSessionsFromHistory(actions), [actions])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/agents" className="hover:text-foreground transition-colors">Agents</Link>
            <span>/</span>
            <span className="text-foreground">{agentId}</span>
          </div>
          <h1 className="text-2xl font-mono font-light tracking-tight text-foreground">{agentId}</h1>
          <AgentBadge agentId={agentId} active />
        </div>
        <div className="text-sm text-muted-foreground space-y-1 text-right">
          <p><span className="font-mono text-foreground">{actions?.length ?? 0}</span> actions</p>
          <p><span className="font-mono text-foreground">{sessions.length}</span> sessions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Timeline tab */}
      {tab === "timeline" && (
        <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm divide-y divide-border">
          {isLoading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-64 rounded" />
              <Skeleton className="h-3 w-20 rounded ml-auto" />
            </div>
          ))}
          {actions?.map((action) => (
            <ActionEntry key={action.id} action={action} />
          ))}
          {actions?.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No actions found.</p>
          )}
        </div>
      )}

      {/* Sessions tab */}
      {tab === "sessions" && (
        <div>
          {isLoading && (
            <div className="grid sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                  <Skeleton className="h-3 w-48 rounded" />
                  <Skeleton className="h-8 w-full rounded" />
                </div>
              ))}
            </div>
          )}
          {sessions.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {sessions.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          )}
          {!isLoading && sessions.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No sessions found.</p>
          )}
        </div>
      )}

      {/* Memory tab */}
      {tab === "memory" && (
        <MemoryPanel defaultQuery={agentId} />
      )}
    </div>
  )
}
