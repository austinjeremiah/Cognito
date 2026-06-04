import { HeroSection } from "@/components/hero-section"
import { FeatureSection } from "@/components/feature-section"
import { HowItWorks } from "@/components/how-it-works"
import { LiveStats } from "@/components/live-stats"
import { ChatPill } from "@/components/chat-pill"
import { Footer } from "@/components/footer"
import { WaterShaderBackground } from "@/components/ui/water-shader-background"

const FEATURES = [
  {
    title: "Tatum RPC",
    description: "All Sui blockchain calls routed through Tatum's production-grade RPC gateway — mainnet anchors, session queries, and event lookups. Reliable, fast, swappable.",
    accent: "tatum",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
  {
    title: "Walrus Storage",
    description: "Every agent action batch stored as a content-addressed blob on Walrus. The blob ID is the cryptographic hash — any tampering is mathematically detectable.",
    accent: "walrus",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 6c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
  },
  {
    title: "Sui Anchor",
    description: "One immutable anchor transaction per session on Sui mainnet via Tatum RPC. Ties the Walrus blob ID and SuiSQL object to a permanent on-chain event.",
    accent: "sui",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Knowledge Graph",
    description: "Agent actions visualized as a DAG. See the full decision tree: branches, convergence points, and cross-edges between findings and verifications.",
    accent: "graph",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    title: "MemWal Memory",
    description: "Every action and session remembered semantically via MemWal on Walrus. Agents recall relevant past context before acting — accountable and context-aware.",
    accent: "memwal",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    title: "Fully Verifiable",
    description: "Audit trail + semantic memory + on-chain anchor + knowledge graph. The only agent runtime where everything that happened can be proven and recalled.",
    accent: "verify",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
  },
]

export default function CognitoLanding() {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="relative z-10">
        <HeroSection />

        <LiveStats />

        <HowItWorks />

        <section className="py-24 px-6 relative">
          <div className="absolute inset-0 opacity-20">
            <WaterShaderBackground />
          </div>
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-3">The stack</p>
              <h2 className="text-4xl md:text-5xl font-light text-foreground tracking-tight">
                Verifiable at every layer.
              </h2>
              <p className="text-muted-foreground mt-3 text-sm font-mono">Uncensorable end to end.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => (
                <FeatureSection
                  key={f.title}
                  title={f.title}
                  description={f.description}
                  icon={f.icon}
                  index={i}
                  accent={f.accent}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-6 border-t border-border/50">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Ready to audit</p>
            <h2 className="text-4xl md:text-5xl font-light text-foreground tracking-tight">
              Every agent decision.
              <br />
              <span className="text-muted-foreground">Proven forever.</span>
            </h2>
            <p className="text-muted-foreground text-sm font-mono leading-relaxed max-w-lg mx-auto">
              Cognito gives your AI agents a tamper-proof memory of everything they did.
              Stored on Walrus. Anchored on Sui. Recalled by MemWal.
            </p>
            <div className="flex items-center gap-4 justify-center pt-4">
              <a
                href="/dashboard"
                className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors tracking-tight font-sans"
              >
                Open Dashboard
              </a>
              <a
                href="https://testnet.suivision.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 rounded-full border border-border text-foreground font-medium hover:bg-muted/50 transition-colors tracking-tight font-sans"
              >
                View on SuiVision
              </a>
            </div>
          </div>
        </section>

        <Footer />
        <ChatPill />
      </div>
    </div>
  )
}
