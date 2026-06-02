import { Card, CardContent } from "@/components/ui/card"
import type { ReactNode } from "react"

interface StatsCardProps {
  label: string
  value: number | string
  icon?: ReactNode
  sublabel?: string
  loading?: boolean
}

export function StatsCard({ label, value, icon, sublabel, loading = false }: StatsCardProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/60">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-2">
              {label}
            </p>
            {loading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-mono font-light text-foreground tracking-tight">
                {value}
              </p>
            )}
            {sublabel && (
              <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
            )}
          </div>
          {icon && (
            <div className="text-2xl opacity-60 ml-4">{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
