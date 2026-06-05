"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface FeatureCardProps {
  title: string
  description: string
  icon: React.ReactNode
  index?: number
  accent: string
}

export function FeatureSection({ title, description, icon, index = 0, accent }: FeatureCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-foreground/20">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-80 transition-opacity duration-300 ${accent}-bg`} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg border ${accent}-border ${accent}-icon`}>
            {icon}
          </div>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <CardTitle className="text-base font-mono tracking-tight">{title}</CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 pt-0">
        <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}
