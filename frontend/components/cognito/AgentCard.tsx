import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { AgentBadge } from "./AgentBadge"
import type { Agent } from "@/app/types"

interface AgentCardProps {
  agent: Agent
}

export function AgentCard({ agent }: AgentCardProps) {
  const lastActive = agent.lastActive
    ? formatDistanceToNow(new Date(agent.lastActive), { addSuffix: true })
    : "never"

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/60 hover:border-border transition-colors">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{agent.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Last active {lastActive}</p>
          </div>
          <AgentBadge agentId={agent.id} className="shrink-0" />
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            <span className="font-mono text-foreground">{agent.totalSessions}</span> sessions
          </span>
          {agent.totalActions != null && (
            <span>
              <span className="font-mono text-foreground">{agent.totalActions}</span> actions
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Link
            href={`/agents/${agent.id}`}
            className="flex-1 text-center text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted/50 transition-colors text-foreground"
          >
            View History
          </Link>
          <Link
            href={`/graph/${agent.id}`}
            className="flex-1 text-center text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted/50 transition-colors text-foreground"
          >
            View Graph
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
