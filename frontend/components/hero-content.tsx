"use client"

import Link from "next/link"

export default function HeroContent() {
  return (
    <div className="text-center my-0 p-0 px-0 py-16 rounded-4xl shadow-none bg-background/85 backdrop-blur-sm border-border border-none border-0">
      <div className="flex items-center justify-center flex-col text-center py-4">
        <div
          className="inline-flex items-center px-3 py-1 rounded-full bg-muted/50 backdrop-blur-sm relative border mb-0 border-border"
          style={{ filter: "url(#glass-effect)" }}
        >
          <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent rounded-full" />
          <span className="text-muted-foreground text-xs md:text-sm relative z-10 font-light">
             The Truth Layer for AI Agents
          </span>
        </div>
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

      <div className="flex items-center gap-4 flex-wrap justify-center">
        <Link
          href="/dashboard"
          className="px-6 py-3 sm:px-8 sm:py-3 rounded-full bg-primary text-primary-foreground font-medium transition-all duration-200 hover:bg-primary/90 focus:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background cursor-pointer tracking-tighter font-sans text-base min-h-[44px] touch-manipulation flex items-center"
          aria-label="Open Cognito Dashboard"
        >
          Open Dashboard
        </Link>
      </div>
    </div>
  )
}
