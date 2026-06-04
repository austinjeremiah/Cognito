"use client"

import type React from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"

interface FeatureCardProps {
  title: string
  description: string
  icon: React.ReactNode
  index?: number
  accent: string
}

export function FeatureSection({ title, description, icon, index = 0, accent }: FeatureCardProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [40, 0, 0, -40])

  return (
    <motion.div ref={ref} className="w-full" style={{ opacity, y }}>
      <div className="group relative border border-border/50 rounded-xl p-6 bg-background/50 backdrop-blur-sm hover:border-foreground/20 hover:bg-card transition-all duration-300 overflow-hidden hover:scale-[1.02] hover:shadow-2xl">
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-80 transition-opacity duration-300 ${accent}-bg`} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2 rounded-lg border ${accent}-border ${accent}-icon`}>
              {icon}
            </div>
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <h3 className="text-base font-mono text-foreground mb-2 tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  )
}
