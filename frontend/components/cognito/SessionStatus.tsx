interface SessionStatusProps {
  status: "active" | "anchored" | "pending"
  className?: string
}

const CONFIG = {
  active: {
    label: "Active",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    dot: "bg-yellow-400",
    pulse: true,
  },
  anchored: {
    label: "Anchored",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    dot: "bg-green-400",
    pulse: false,
  },
  pending: {
    label: "Pending",
    color: "bg-muted/50 text-muted-foreground border-border",
    dot: "bg-muted-foreground",
    pulse: false,
  },
}

export function SessionStatus({ status, className = "" }: SessionStatusProps) {
  const cfg = CONFIG[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${cfg.color} ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {cfg.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
      </span>
      {cfg.label}
    </span>
  )
}
