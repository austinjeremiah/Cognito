"use client"

import { useState } from "react"
import { useAgents } from "@/hooks/useAgents"
import { AgentCard } from "@/components/cognito/AgentCard"
import { Skeleton } from "@/components/ui/skeleton"

export default function AgentsPage() {
  const { data: agents, isLoading, isError } = useAgents()
  const [search, setSearch] = useState("")

  const filtered = agents?.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-mono font-light tracking-tight text-foreground">Agents</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-sm text-muted-foreground">
              {agents ? `${agents.length} agent${agents.length !== 1 ? "s" : ""} registered` : "Loading..."}
            </p>
          </div>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-56 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border focus:bg-card transition-all"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 p-5 space-y-4">
              <Skeleton className="h-4 w-32 rounded" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
          Could not load agents — is the backend running on port 3001?
        </div>
      )}

      {/* Empty */}
      {filtered && filtered.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-card/30 p-12 text-center text-sm text-muted-foreground">
          {search ? `No agents match "${search}"` : "No agents found. Run npm run seed in the backend."}
        </div>
      )}

      {/* Grid */}
      {filtered && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}

    </div>
  )
}
