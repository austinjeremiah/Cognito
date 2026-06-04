import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { Agent } from "@/app/types"

interface AgentCardProps {
  agent: Agent
}

export function AgentCard({ agent }: AgentCardProps) {
  const lastActive = agent.lastActive
    ? formatDistanceToNow(new Date(agent.lastActive), { addSuffix: true })
    : "never"

  return (
    <div className="group relative rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 hover:bg-card hover:border-border hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col gap-4">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent group-hover:via-foreground/20 transition-all duration-300" />

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <p className="font-mono font-medium text-foreground truncate">{agent.name}</p>
          </div>
          <p className="text-xs text-muted-foreground font-mono truncate pl-4">{agent.id}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-lg bg-muted/30 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-3xl font-mono font-light text-foreground">{agent.totalSessions}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Sessions</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Last active</p>
          <p className="text-sm font-mono text-foreground mt-0.5">{lastActive}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        <Link
          href={`/agents/${agent.id}`}
          className="flex-1 text-center text-xs px-3 py-2 rounded-lg border border-border/50 hover:bg-muted/50 hover:border-border transition-all duration-200 text-muted-foreground hover:text-foreground font-mono"
        >
          Timeline
        </Link>
        <Link
          href={`/graph/${agent.id}`}
          className="flex-1 text-center text-xs px-3 py-2 rounded-lg border border-border/50 hover:bg-muted/50 hover:border-border transition-all duration-200 text-muted-foreground hover:text-foreground font-mono"
        >
          Graph
        </Link>
        <Link
          href={`/agents/${agent.id}`}
          className="flex-1 text-center text-xs px-3 py-2 rounded-lg bg-foreground/5 border border-border/50 hover:bg-foreground/10 hover:border-border transition-all duration-200 text-foreground font-mono"
        >
          Memory
        </Link>
      </div>
    </div>
  )
}
