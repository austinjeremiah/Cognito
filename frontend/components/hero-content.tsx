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
            Cryptographic Proof of Agent Actions · Tatum · Walrus · Sui · MemWal
          </span>
        </div>
      </div>

      <h1
        id="main-content"
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight font-light text-foreground mb-6 leading-tight scroll-mt-20"
      >
        <span className="instrument gold-shimmer mx-0 text-center font-normal font-mono">Cognito</span>
        <br />
        <span className="font-light text-foreground tracking-tight">Agent Audit Trail</span>
      </h1>

      <p className="font-light text-muted-foreground mb-8 leading-relaxed max-w-xl mx-auto font-mono tracking-tight text-balance text-xs md:text-sm">
        Every agent action logged, stored on Walrus, anchored to Sui via Tatum RPC, and remembered semantically via MemWal.
        Tamper-proof. Publicly verifiable. Context-aware. No trust required.
      </p>

      <div className="flex items-center gap-4 flex-wrap justify-center">
        <Link
          href="/dashboard"
          className="px-6 py-3 sm:px-8 sm:py-3 rounded-full bg-primary text-primary-foreground font-medium transition-all duration-200 hover:bg-primary/90 focus:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background cursor-pointer tracking-tighter font-sans text-base min-h-[44px] touch-manipulation flex items-center"
          aria-label="Open Cognito Dashboard"
        >
          Open Dashboard
        </Link>
        <a
          href="https://testnet.suivision.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 sm:px-8 sm:py-3 rounded-full border border-border bg-background/50 text-foreground font-medium transition-all duration-200 hover:bg-muted/50 tracking-tighter font-sans text-base min-h-[44px] flex items-center"
        >
          View on SuiVision
        </a>
      </div>
    </div>
  )
}
