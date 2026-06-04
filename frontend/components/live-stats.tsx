"use client"

import { useEffect, useState } from "react"

interface Stats {
  totalAgents: number
  totalSessions: number
  totalActions: number
  totalAnchors: number
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
const API_KEY = process.env.NEXT_PUBLIC_COGNITO_KEY ?? ""

function useStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    function load() {
      fetch(`${BASE}/api/stats`, { headers: { "x-api-key": API_KEY } })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => d && setStats(d))
        .catch(() => {})
    }
    load()
    const id = setInterval(load, 15_000)
    return () => clearInterval(id)
  }, [])

  return stats
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) return
    let start = 0
    const step = Math.ceil(value / 30)
    const id = setInterval(() => {
      start = Math.min(start + step, value)
      setDisplay(start)
      if (start >= value) clearInterval(id)
    }, 30)
    return () => clearInterval(id)
  }, [value])

  return <span>{display.toLocaleString()}</span>
}

export function LiveStats() {
  const stats = useStats()

  const items = [
    { label: "Actions Logged", value: stats?.totalActions ?? 0 },
    { label: "Sessions", value: stats?.totalSessions ?? 0 },
    { label: "Agents", value: stats?.totalAgents ?? 0 },
    { label: "On-chain Anchors", value: stats?.totalAnchors ?? 0 },
  ]

  return (
    <div className="w-full border-y border-border/50 bg-muted/20 backdrop-blur-sm py-4 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xl font-mono font-light text-foreground tabular-nums">
                  {stats ? <AnimatedNumber value={item.value} /> : "—"}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">{item.label}</p>
              </div>
              <div className="w-px h-8 bg-border/50 last:hidden" />
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-muted-foreground font-mono">live</span>
          </div>
        </div>
      </div>
    </div>
  )
}
