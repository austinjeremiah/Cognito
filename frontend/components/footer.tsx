"use client"

import { WaterShaderBackground } from "@/components/ui/water-shader-background"

export function Footer() {
  return (
    <footer className="relative border-t border-border overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <WaterShaderBackground />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 text-center relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-8xl select-none md:text-9xl font-mono tracking-[-0.1em] text-muted-foreground font-light">
            Cognito
          </h2>
        </div>

        <div className="flex items-center justify-center gap-8 mb-12 text-sm">
          <a
            href="https://github.com/austinjeremiah/Cognito"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://testnet.suivision.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            SuiVision
          </a>
          <a
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </a>
        </div>

        <div className="text-center pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground">© 2026 Cognito · Verifiable Agent Audit Trail · Built on Tatum · Walrus · Sui</p>
        </div>
      </div>
    </footer>
  )
}
