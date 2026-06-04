"use client"

import { ArrowRight } from "lucide-react"

export function ChatPill() {
  return (
    <a
      href="https://github.com/austinjeremiah/Cognito"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-secondary border border-border backdrop-blur-xl hover:bg-card hover:border-border/80 transition-all duration-200 min-h-[44px] touch-manipulation whitespace-nowrap"
      aria-label="View Cognito on GitHub"
    >
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
      <span className="text-sm text-foreground/80 font-mono tracking-tight">
        Open source · GitHub
      </span>
      <ArrowRight size={13} className="text-muted-foreground" />
    </a>
  )
}
