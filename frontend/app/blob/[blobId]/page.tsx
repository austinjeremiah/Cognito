"use client"

import { use, useEffect, useState } from "react"
import { formatDistanceToNow, format } from "date-fns"
import { ActionTypeIcon } from "@/components/cognito/ActionTypeIcon"
import { BlobLink } from "@/components/cognito/BlobLink"
import { Skeleton } from "@/components/ui/skeleton"
import type { ActionLog } from "@/app/types"

const WALRUS_AGGREGATOR =
  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR ?? "https://aggregator.walrus-testnet.walrus.space"

function tryParseJson(str: string): Record<string, unknown> | null {
  try {
    const p = JSON.parse(str)
    if (typeof p === "object" && p !== null && !Array.isArray(p)) return p
  } catch {}
  return null
}

function Description({ text }: { text: string }) {
  const parsed = tryParseJson(text)
  if (parsed) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {Object.entries(parsed).map(([k, v]) => (
          <span key={k} className="text-xs font-mono bg-muted/60 px-1.5 py-0.5 rounded text-muted-foreground">
            <span className="text-foreground">{k}</span>: {String(v)}
          </span>
        ))}
      </div>
    )
  }
  return <p className="text-sm text-foreground mt-1 leading-relaxed">{text}</p>
}

export default function BlobViewerPage({ params }: { params: Promise<{ blobId: string }> }) {
  const { blobId } = use(params)
  const decoded = decodeURIComponent(blobId)

  const [actions, setActions] = useState<ActionLog[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${decoded}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Walrus returned ${r.status}`)
        return r.json()
      })
      .then((data) => {
        const arr = Array.isArray(data) ? data : null
        if (!arr) throw new Error("Blob is not an action array")
        setActions(arr)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [decoded])

  const agentId = actions?.[0]?.agentId
  const sessionId = actions?.[0]?.sessionId
  const startedAt = actions?.[0]?.ts
  const endedAt = actions?.[actions.length - 1]?.ts

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Walrus Blob</p>
        <h1 className="text-lg font-mono font-light text-foreground break-all">{decoded}</h1>
        <BlobLink blobId={decoded} />
      </div>

      {/* Metadata */}
      {actions && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Agent</p>
            <p className="text-sm font-mono text-foreground truncate">{agentId}</p>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Actions</p>
            <p className="text-3xl font-mono font-light text-foreground">{actions.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Started</p>
            <p className="text-sm font-mono text-foreground">
              {startedAt ? format(new Date(startedAt), "MMM d, HH:mm:ss") : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Duration</p>
            <p className="text-sm font-mono text-foreground">
              {startedAt && endedAt
                ? `${((endedAt - startedAt) / 1000).toFixed(1)}s`
                : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Action timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground uppercase tracking-widest">
            Action Timeline — fetched directly from Walrus
          </h2>
          {sessionId && (
            <a
              href={`/sessions/${sessionId}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View session page
            </a>
          )}
        </div>

        {loading && (
          <div className="rounded-xl border border-border bg-card/50 divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-72 rounded" />
                <Skeleton className="h-3 w-16 rounded ml-auto" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            Failed to load blob: {error}
          </div>
        )}

        {actions && (
          <div className="rounded-xl border border-border bg-card/50 divide-y divide-border">
            {actions.map((action, i) => (
              <div key={action.id ?? i} className="px-4 py-3 flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <ActionTypeIcon type={action.actionType} />
                </div>
                <div className="flex-1 min-w-0">
                  <Description text={action.description} />
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {action.id?.slice(0, 8)}
                    {action.parentActionId && (
                      <span className="ml-2 opacity-50">← {action.parentActionId.slice(0, 8)}</span>
                    )}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {action.ts ? formatDistanceToNow(new Date(action.ts), { addSuffix: true }) : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
