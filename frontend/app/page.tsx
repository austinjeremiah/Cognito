import { HeroSection } from "@/components/hero-section"
import { FeatureSection } from "@/components/feature-section"
import { ChatPill } from "@/components/chat-pill"
import { Footer } from "@/components/footer"
import { WaterShaderBackground } from "@/components/ui/water-shader-background"

export default function CognitoLanding() {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="relative z-10">
        <HeroSection />

        <section className="py-32 px-6 relative">
          <div className="absolute inset-0 opacity-30">
            <WaterShaderBackground />
          </div>
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-medium text-foreground mb-6 tracking-tight">
                The full stack
              </h2>
              <p className="text-xl text-muted-foreground">Verifiable at every layer. Uncensorable end to end.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <FeatureSection title="Tatum RPC" description="All Sui blockchain calls routed through Tatum's production-grade RPC gateway — mainnet anchors, session queries, and event lookups. Reliable, fast, swappable." index={0} />

              <FeatureSection title="Walrus Storage" description="Every agent action batch stored as a content-addressed blob on Walrus. The blob ID is the cryptographic hash — any tampering is mathematically detectable." index={1} />

              <FeatureSection title="Sui Mainnet Anchor" description="One immutable anchor transaction per session on Sui mainnet via Tatum RPC. Ties the Walrus blob ID and SuiSQL object to a permanent on-chain event." index={2} />

              <FeatureSection title="Knowledge Graph" description="Agent actions visualized as a DAG. See the full decision tree: branches, convergence points, and cross-edges between findings and verifications." index={3} />

              <FeatureSection title="MemWal Semantic Memory" description="Every action and completed session is remembered semantically via MemWal on Walrus. Agents recall relevant past context before acting — accountable and context-aware." index={4} />

              <FeatureSection title="Fully Verifiable Stack" description="Audit trail + semantic memory + on-chain anchor + knowledge graph. The only agent runtime where everything that happened can be proven and recalled." index={5} />
            </div>
          </div>
        </section>

        <Footer />

        <ChatPill />
      </div>
    </div>
  )
}
