"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface AgentBadgeProps {
  agentId: string
  active?: boolean
  className?: string
}

export function AgentBadge({ agentId, active = false, className = "" }: AgentBadgeProps) {
  const [copied, setCopied] = useState(false)
  const short = `${agentId.slice(0, 8)}…${agentId.slice(-4)}`

  async function copy() {
    await navigator.clipboard.writeText(agentId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs font-mono
        bg-muted/50 border border-border text-muted-foreground ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-400" : "bg-muted-foreground/40"}`} />
      {short}
      <button
        onClick={copy}
        className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Copy agent ID"
      >
        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
      </button>
    </span>
  )
}
