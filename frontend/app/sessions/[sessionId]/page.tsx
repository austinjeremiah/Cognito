"use client"

import { use } from "react"
import Link from "next/link"
import { formatDistanceToNow, format } from "date-fns"
import { useSessions } from "@/hooks/useSessions"
import { useSessionActions } from "@/hooks/useSessionActions"
import { api } from "@/app/lib/api"
import { VerifyPanel } from "@/components/cognito/VerifyPanel"
import { ActionEntry } from "@/components/cognito/ActionEntry"
import { TxBadge } from "@/components/cognito/TxBadge"
import { BlobLink } from "@/components/cognito/BlobLink"
import { SessionStatus } from "@/components/cognito/SessionStatus"
import { Skeleton } from "@/components/ui/skeleton"
import type { VerifyProof } from "@/app/types"

export default function SessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const { data: session, isLoading: sessionLoading } = useSessions(sessionId)
  const { data: actions, isLoading: actionsLoading } = useSessionActions(sessionId)

  const status = session?.mainnetTxDigest ? "anchored" : session?.endedAt ? "pending" : "active"
  const lastAction = actions?.[actions.length - 1]

  async function verify(actionId: string): Promise<VerifyProof> {
    return api.get<VerifyProof>(`/verify/${actionId}`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/agents" className="hover:text-foreground transition-colors">Agents</Link>
            {session && (
              <>
                <span>/</span>
                <Link href={`/agents/${session.agentId}`} className="hover:text-foreground transition-colors">
                  {session.agentId}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-foreground">Session</span>
          </div>
          <h1 className="text-xl font-mono font-light tracking-tight text-foreground break-all">
            {sessionId}
          </h1>
        </div>
        {session && <SessionStatus status={status} />}
      </div>

      {/* Session metadata */}
      {sessionLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : session ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Started</p>
            <p className="font-mono text-sm text-foreground">
              {format(new Date(session.startedAt), "MMM d, HH:mm:ss")}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Actions</p>
            <p className="font-mono text-3xl font-light text-foreground">{session.actionCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Storage</p>
            <div className="flex flex-col gap-2">
              {session.blobId && <BlobLink blobId={session.blobId} />}
              {session.mainnetTxDigest && <TxBadge digest={session.mainnetTxDigest} label="Anchor tx" />}
            </div>
          </div>
        </div>
      ) : null}

      {/* Two column: actions + verify */}
      <div className="flex flex-col md:flex-row gap-6 items-start">

        {/* Action timeline */}
        <div className="flex-1 min-w-0 space-y-3">
          <h2 className="text-sm font-medium text-foreground uppercase tracking-widest">
            Action Timeline
          </h2>
          <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm divide-y divide-border">
            {actionsLoading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-64 rounded" />
              </div>
            ))}
            {actions?.map((action) => (
              <ActionEntry key={action.id} action={action} />
            ))}
            {!actionsLoading && actions?.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No actions in this session.</p>
            )}
          </div>
        </div>

        {/* Verify panel */}
        <div className="w-full md:w-[360px] shrink-0 space-y-3 md:sticky md:top-20">
          <h2 className="text-sm font-medium text-foreground uppercase tracking-widest">
            Integrity Proof
          </h2>
          {lastAction ? (
            <VerifyPanel actionId={lastAction.id} onVerify={verify} />
          ) : (
            <div className="rounded-xl border border-border bg-card/50 p-6 text-sm text-muted-foreground text-center">
              {actionsLoading ? "Loading..." : "No actions to verify."}
            </div>
          )}
          {lastAction && (
            <p className="text-xs text-muted-foreground font-mono mt-2">
              Verifying action {actions!.length} of {actions!.length}
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
