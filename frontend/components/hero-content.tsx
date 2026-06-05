"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function HeroContent() {
  return (
    <div className="text-center my-0 p-0 px-0 py-16 rounded-4xl shadow-none bg-background/85 backdrop-blur-sm border-border border-none border-0">
      <div className="flex items-center justify-center flex-col text-center py-4">
        <Badge variant="outline" className="mb-4 px-4 py-1.5 text-xs md:text-sm font-light text-muted-foreground border-border/60 bg-muted/50 backdrop-blur-sm rounded-full">
          The Truth Layer for AI Agents
        </Badge>
      </div>

      <h1
        id="main-content"
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight font-light text-foreground mb-6 leading-tight scroll-mt-20"
      >
        <span className="instrument gold-shimmer mx-0 text-center font-normal font-mono">Cognito</span>
        <br />
        <span className="font-light text-foreground tracking-tight">The Truth Layer for AI</span>
      </h1>

      <p className="font-light text-muted-foreground mb-8 max-w-xl mx-auto tracking-tight text-balance text-lg md:text-2xl">
        Your agents act. We prove it forever.
      </p>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <Button asChild size="lg" className="rounded-full px-8 tracking-tight font-sans">
          <Link href="/dashboard" aria-label="Open Cognito Dashboard">
            Open Dashboard
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full px-8 tracking-tight font-sans">
          <a href="https://github.com/austinjeremiah/Cognito" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </Button>
      </div>
    </div>
  )
}
