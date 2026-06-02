"use client"

import { useState } from "react"
import { useAgents } from "@/hooks/useAgents"
import { AgentCard } from "@/components/cognito/AgentCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-mono font-light tracking-tight text-foreground">Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {agents ? `${agents.length} agent${agents.length !== 1 ? "s" : ""} registered` : "Loading..."}
          </p>
        </div>
        <Input
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 bg-card/50 border-border/60 font-mono text-sm"
        />
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-5 space-y-3">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
              <Skeleton className="h-8 w-full rounded" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
          Could not load agents — is the backend running on port 3001?
        </div>
      )}

      {filtered && filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
          {search ? `No agents match "${search}"` : "No agents found. Run npm run seed in the backend."}
        </div>
      )}

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
