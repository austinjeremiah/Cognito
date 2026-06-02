import { Wrench, MonitorDot, Brain, Plug, Search, Settings } from "lucide-react"
import type { ActionLog } from "@/app/types"

type ActionType = ActionLog["actionType"]

const CONFIG: Record<ActionType, { icon: React.ElementType; color: string; label: string }> = {
  tool_use:   { icon: Wrench,     color: "text-teal-400",           label: "Tool Use" },
  code_write: { icon: MonitorDot, color: "text-green-400",          label: "Code Write" },
  decision:   { icon: Brain,      color: "text-orange-400",         label: "Decision" },
  api_call:   { icon: Plug,       color: "text-purple-400",         label: "API Call" },
  web_search: { icon: Search,     color: "text-blue-400",           label: "Web Search" },
  other:      { icon: Settings,   color: "text-muted-foreground",   label: "Other" },
}

interface ActionTypeIconProps {
  type: ActionType
  showLabel?: boolean
  className?: string
}

export function ActionTypeIcon({ type, showLabel = false, className = "" }: ActionTypeIconProps) {
  const cfg = CONFIG[type] ?? CONFIG.other
  const Icon = cfg.icon

  return (
    <span className={`inline-flex items-center gap-1.5 ${cfg.color} ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {showLabel && <span className="text-xs font-medium">{cfg.label}</span>}
    </span>
  )
}
