"use client"

import { useState } from "react"
import { useMemoryRecall } from "@/hooks/useMemoryRecall"
import { BlobLink } from "./BlobLink"
import { Skeleton } from "@/components/ui/skeleton"

interface MemoryPanelProps {
  defaultQuery?: string
}

function DistanceBadge({ distance }: { distance: number }) {
  const pct = Math.round((1 - distance) * 100)
  const color =
    pct >= 80 ? "text-green-400 bg-green-500/10 border-green-500/20"
    : pct >= 60 ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
    : "text-muted-foreground bg-muted/40 border-border"

  return (
    <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${color}`}>
      {pct}% match
    </span>
  )
}

export function MemoryPanel({ defaultQuery = "" }: MemoryPanelProps) {
  const [query, setQuery] = useState(defaultQuery)
  const { mutate, data, isPending } = useMemoryRecall()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) mutate({ query: query.trim() })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search agent memory..."
          className="flex-1 px-3 py-2 text-sm rounded-lg bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
        />
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 transition-opacity"
        >
          {isPending ? "Recalling..." : "Recall"}
        </button>
      </form>

      {isPending && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {data && !isPending && (
        <div className="space-y-2">
          {data.results.length === 0 && (
            <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
              No memories found for this query.
            </div>
          )}
          {data.results.map((mem, i) => (
            <div key={i} className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <DistanceBadge distance={mem.distance} />
                {mem.blob_id && <BlobLink blobId={mem.blob_id} />}
              </div>
              <p className="text-sm text-foreground leading-relaxed font-mono">{mem.text}</p>
            </div>
          ))}
          {data.total > 0 && (
            <p className="text-xs text-muted-foreground text-right">{data.total} result{data.total !== 1 ? "s" : ""}</p>
          )}
        </div>
      )}
    </div>
  )
}
