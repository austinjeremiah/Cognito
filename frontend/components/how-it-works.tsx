"use client"

import { motion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import { Badge } from "@/components/ui/badge"

const STEPS = [
  {
    number: "01",
    title: "Agent Acts",
    description: "Every tool call, decision, and API request your AI agent makes is captured in real time via Mastra. No instrumentation required.",
    detail: "log_action → SuiSQL + queue",
  },
  {
    number: "02",
    title: "Cognito Stores",
    description: "Actions are batched and written to Walrus as content-addressed blobs. The blob ID is the cryptographic fingerprint — unforgeable.",
    detail: "Walrus blob → blobId",
  },
  {
    number: "03",
    title: "MemWal Remembers",
    description: "Every action is embedded and stored semantically via MemWal. Future agent runs recall past decisions — context-aware from day one.",
    detail: "recall() → agent context",
  },
  {
    number: "04",
    title: "Sui Anchors",
    description: "One immutable transaction per session on Sui. The blobId is tied to an on-chain event — publicly verifiable, permanently uncensorable.",
    detail: "SessionAnchored → on-chain",
  },
]

export function HowItWorks() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end center"] })
  const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1])
  const y = useTransform(scrollYProgress, [0, 0.2], [30, 0])

  return (
    <section ref={ref} className="py-32 px-6">
      <motion.div className="max-w-5xl mx-auto" style={{ opacity, y }}>
        <div className="text-center mb-16">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-3">How it works</p>
          <h2 className="text-4xl md:text-5xl font-light text-foreground tracking-tight">
            Four steps. Fully provable.
          </h2>
        </div>

        <div className="relative">
          <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-border via-border/50 to-transparent hidden md:block" />

          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                className="flex gap-6 group"
              >
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center text-xs font-mono text-muted-foreground group-hover:border-foreground/30 group-hover:text-foreground transition-colors duration-300 z-10">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1 pb-6 border-b border-border/30 last:border-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-mono text-foreground">{step.title}</h3>
                    <Badge variant="outline" className="text-xs font-mono text-muted-foreground shrink-0">
                      {step.detail}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
