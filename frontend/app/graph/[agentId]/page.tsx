"use client"

import { use, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { X, ExternalLink } from "lucide-react"
import { useGraph, type GraphNode } from "@/hooks/useGraph"
import { ActionTypeIcon } from "@/components/cognito/ActionTypeIcon"
import { formatDistanceToNow } from "date-fns"
import type { ActionLog } from "@/app/types"

const AgentGraph = dynamic(
  () => import("@/components/cognito/AgentGraph").then((m) => ({ default: m.AgentGraph })),
  { ssr: false, loading: () => <GraphLoading /> }
)

function GraphLoading() {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground font-mono">Building graph...</p>
      </div>
    </div>
  )
}

const TYPE_COLORS: Record<string, string> = {
  tool_use:   "#2dd4bf",
  code_write: "#4ade80",
  decision:   "#fb923c",
  api_call:   "#c084fc",
  web_search: "#60a5fa",
  other:      "#6b7280",
}

const TYPE_LABELS: Record<string, string> = {
  tool_use:   "Tool Use",
  code_write: "Code Write",
  decision:   "Decision",
  api_call:   "API Call",
  web_search: "Web Search",
  other:      "Other",
}

const WALRUS_AGGREGATOR =
  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR ?? "https://aggregator.walrus-testnet.walrus.space"

export default function GraphPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params)
  const { data, isLoading, isError } = useGraph(agentId)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedBlobId, setSelectedBlobId] = useState<string | null>(null)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const graphRef = useRef<any>(null)

  // Group nodes by blobId — each blobId = one session
  const sessionGroups = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { blobId: string; count: number; anchored: boolean; index: number }>()
    let idx = 1
    for (const n of data.nodes) {
      if (!n.blobId) continue
      if (!map.has(n.blobId)) {
        map.set(n.blobId, { blobId: n.blobId, count: 0, anchored: false, index: idx++ })
      }
      const s = map.get(n.blobId)!
      s.count++
      if (n.anchored) s.anchored = true
    }
    return Array.from(map.values()).sort((a, b) => Number(b.anchored) - Number(a.anchored))
  }, [data])

  const activeBlobId = selectedBlobId ?? sessionGroups[0]?.blobId ?? null
  const activeSession = sessionGroups.find((s) => s.blobId === activeBlobId)

  const filteredNodes = useMemo(
    () => data?.nodes.filter((n) => n.blobId === activeBlobId) ?? [],
    [data, activeBlobId]
  )
  const filteredEdges = useMemo(() => data?.edges ?? [], [data])

  function openBlob(blobId: string) {
    window.open(`${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`, "_blank", "noopener")
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">

      {/* Left sidebar */}
      <div className={`${sidebarExpanded ? "w-72" : "w-52"} shrink-0 h-full bg-background/80 backdrop-blur-sm border-r border-border flex flex-col p-4 gap-6 transition-all duration-200`}>

        {/* Session selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Session</p>
            <button
              onClick={() => setSidebarExpanded((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={sidebarExpanded ? "Collapse" : "Expand"}
            >
              <svg className={`w-3 h-3 transition-transform duration-200 ${sidebarExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <select
            value={activeBlobId ?? ""}
            onChange={(e) => { setSelectedBlobId(e.target.value); setSelectedNode(null) }}
            className="w-full bg-muted/50 border border-border rounded-md px-2 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {sessionGroups.map((s) => (
              <option key={s.blobId} value={s.blobId}>
                S{s.index}{s.anchored ? " · anchored" : ""} · {s.count} nodes
              </option>
            ))}
          </select>
          {activeSession?.anchored && (
            <button
              onClick={() => activeBlobId && openBlob(activeBlobId)}
              className="w-full text-left text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View blob
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Types</p>
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TYPE_COLORS[type] }} />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-auto space-y-3">
          <div className="rounded-lg bg-muted/30 p-3 space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nodes</span>
              <span className="text-foreground">{filteredNodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Edges</span>
              <span className="text-foreground">{filteredEdges.length}</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground opacity-50 leading-relaxed">scroll to zoom · drag to pan · click node for details</p>
        </div>
      </div>

      {/* Graph canvas */}
      <div className="flex-1 relative">
        {isLoading && <GraphLoading />}

        {isError && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Could not load graph — is the backend running?</p>
          </div>
        )}

        {data && filteredNodes.length > 0 && (
          <>
            {/* Breadcrumb */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 text-xs text-muted-foreground bg-background/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border">
              <Link href="/agents" className="hover:text-foreground transition-colors">Agents</Link>
              <span>/</span>
              <Link href={`/agents/${agentId}`} className="hover:text-foreground transition-colors">{agentId}</Link>
              <span>/</span>
              <span className="text-foreground">Graph</span>
            </div>

            <AgentGraph
              nodes={filteredNodes}
              edges={filteredEdges}
              onNodeClick={setSelectedNode}
            />
          </>
        )}
      </div>

      {/* Node detail panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
            className="w-[300px] shrink-0 h-full bg-background/95 backdrop-blur-md border-l border-border overflow-y-auto"
          >
            <div className="p-5 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <ActionTypeIcon type={selectedNode.type as ActionLog["actionType"]} />
                  <span className="text-sm font-medium text-foreground">
                    {TYPE_LABELS[selectedNode.type] ?? "Action"}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Description</p>
                  <p className="text-sm text-foreground leading-relaxed">{selectedNode.label}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Action ID</p>
                  <p className="text-xs font-mono text-muted-foreground break-all">{selectedNode.id}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Timestamp</p>
                  <p className="text-sm text-foreground">
                    {formatDistanceToNow(new Date(selectedNode.ts), { addSuffix: true })}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium ${
                    selectedNode.anchored
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedNode.anchored ? "bg-green-400" : "bg-yellow-400"}`} />
                    {selectedNode.anchored ? "Anchored" : "Not anchored"}
                  </span>
                </div>
              </div>

              {/* Primary action — view blob */}
              {selectedNode.blobId && (
                <button
                  onClick={() => openBlob(selectedNode.blobId!)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Walrus Blob
                </button>
              )}

              <Link
                href={`/agents/${agentId}`}
                className="block text-center text-xs px-3 py-2 rounded-md border border-border hover:bg-muted/50 transition-colors text-muted-foreground"
              >
                View full timeline
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
