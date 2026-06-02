"use client"

import { useState } from "react"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { CheckCircle, XCircle, Clock, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TxBadge } from "./TxBadge"
import { BlobLink } from "./BlobLink"
import type { VerifyProof } from "@/app/types"

interface VerifyPanelProps {
  actionId: string
  onVerify: (actionId: string) => Promise<VerifyProof>
}

type State = "idle" | "loading" | "done"

const STEPS = [
  { key: "blobFetched",           label: "Blob fetched from Walrus" },
  { key: "hashMatchesBlobId",     label: "Action record found in blob" },
  { key: "onChainEventFound",     label: "On-chain anchor event found" },
  { key: "onChainBlobIdMatches",  label: "On-chain blob ID matches" },
] as const

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18 } },
}

const item: Variants = {
  hidden: { opacity: 0, x: -12 },
  show:   { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
}

function StepRow({ label, pass }: { label: string; pass: boolean }) {
  return (
    <motion.div variants={item} className="flex items-center gap-3 py-2">
      {pass ? (
        <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-red-400 shrink-0" />
      )}
      <span className={`text-sm ${pass ? "text-foreground" : "text-red-400"}`}>{label}</span>
    </motion.div>
  )
}

export function VerifyPanel({ actionId, onVerify }: VerifyPanelProps) {
  const [state, setState] = useState<State>("idle")
  const [proof, setProof] = useState<VerifyProof | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setState("loading")
    setError(null)
    setProof(null)
    try {
      const result = await onVerify(actionId)
      setProof(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed")
    } finally {
      setState("done")
    }
  }

  const statusColor = {
    verified:   "text-green-400 border-green-500/20 bg-green-500/10",
    tampered:   "text-red-400 border-red-500/20 bg-red-500/10",
    unanchored: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10",
  }

  return (
    <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium text-foreground">Integrity Verification</h3>
      </div>

      <p className="text-xs text-muted-foreground font-mono break-all">
        Action: {actionId}
      </p>

      <Button
        onClick={run}
        disabled={state === "loading"}
        className="w-full"
        variant={state === "done" && proof?.status === "verified" ? "default" : "outline"}
      >
        {state === "loading" ? (
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin" />
            Verifying…
          </span>
        ) : state === "done" ? "Run Again" : "Run Verification"}
      </Button>

      <AnimatePresence>
        {state === "done" && proof && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${statusColor[proof.status]}`}>
              {proof.status === "verified" && "Verified — data integrity confirmed"}
              {proof.status === "tampered" && "Tampered — hash mismatch detected"}
              {proof.status === "unanchored" && "Unanchored — not yet on-chain"}
            </div>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="border border-border rounded-lg divide-y divide-border"
            >
              {STEPS.map((s) => (
                <div key={s.key} className="px-4">
                  <StepRow label={s.label} pass={proof.steps[s.key]} />
                </div>
              ))}
            </motion.div>

            {proof.mainnetTxDigest && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Anchor tx:</span>
                <TxBadge digest={proof.mainnetTxDigest} />
              </div>
            )}

            {proof.recomputedBlobId && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Blob:</span>
                <BlobLink blobId={proof.recomputedBlobId} />
              </div>
            )}
          </motion.div>
        )}

        {state === "done" && error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
