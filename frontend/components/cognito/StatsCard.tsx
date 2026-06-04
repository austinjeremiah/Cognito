"use client"

import { useEffect, useState } from "react"

interface StatsCardProps {
  label: string
  value: number | string
  sublabel?: string
  loading?: boolean
  accent?: "green" | "blue" | "purple" | "gold"
}

const ACCENTS = {
  green:  { glow: "hover:shadow-green-500/10",  border: "hover:border-green-500/30",  dot: "bg-green-400" },
  blue:   { glow: "hover:shadow-blue-500/10",   border: "hover:border-blue-500/30",   dot: "bg-blue-400" },
  purple: { glow: "hover:shadow-purple-500/10", border: "hover:border-purple-500/30", dot: "bg-purple-400" },
  gold:   { glow: "hover:shadow-yellow-500/10", border: "hover:border-yellow-500/30", dot: "bg-yellow-400" },
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!value) return
    let current = 0
    const step = Math.max(1, Math.ceil(value / 40))
    const id = setInterval(() => {
      current = Math.min(current + step, value)
      setDisplay(current)
      if (current >= value) clearInterval(id)
    }, 20)
    return () => clearInterval(id)
  }, [value])

  return <>{display.toLocaleString()}</>
}

export function StatsCard({ label, value, sublabel, loading = false, accent = "blue" }: StatsCardProps) {
  const a = ACCENTS[accent]

  return (
    <div className={`relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-xl hover:bg-card ${a.glow} ${a.border} group overflow-hidden`}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent group-hover:via-foreground/20 transition-all duration-300" />

      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">{label}</p>

      {loading ? (
        <div className="h-10 w-24 bg-muted animate-pulse rounded mb-1" />
      ) : (
        <p className="text-4xl font-mono font-light text-foreground tracking-tight mb-1">
          {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
        </p>
      )}

      {sublabel && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        </div>
      )}
    </div>
  )
}
