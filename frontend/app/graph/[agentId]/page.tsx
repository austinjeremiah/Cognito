"use client"

import { use, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { X, ExternalLink, Send, Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { useGraph, type GraphNode } from "@/hooks/useGraph"
import { useExplain } from "@/hooks/useExplain"
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
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string; blobUrl?: string }[]>([])
  const graphRef = useRef<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const explain = useExplain()

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

  function handleNodeSelect(node: GraphNode) {
    setSelectedNode(node)
    setMessages([])
    setChatInput("")
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim() || explain.isPending) return

    const question = chatInput.trim()
    setChatInput("")
    setMessages((prev) => [...prev, { role: "user", text: question }])

    const actions = filteredNodes.map((n) => ({
      id: n.id,
      actionType: n.type,
      description: n.label,
      ts: n.ts,
      blobId: n.blobId,
    }))

    const aggregator = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR ?? "https://aggregator.walrus-testnet.walrus.space"

    // Fetch MemWal memories + blob content in parallel
    const [memories, blobContent] = await Promise.all([
      // MemWal recall
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/memory/recall?q=${encodeURIComponent(question)}&topK=3`,
        { headers: { "x-api-key": process.env.NEXT_PUBLIC_COGNITO_KEY ?? "" } }
      ).then(r => r.ok ? r.json() : { results: [] })
        .then((d: { results: { text: string }[] }) => d.results.map(r => r.text))
        .catch(() => [] as string[]),

      // Fetch blob for selected node or first node with blobId
      (async () => {
        const blobId = selectedNode?.blobId ?? actions.find(a => a.blobId)?.blobId
        if (!blobId) return undefined
        try {
          const r = await fetch(`${aggregator}/v1/blobs/${blobId}`)
          if (!r.ok) return undefined
          const data = await r.json()
          return Array.isArray(data) ? data as Record<string, unknown>[] : undefined
        } catch { return undefined }
      })(),
    ])

    try {
      const blobId = selectedNode?.blobId ?? actions.find(a => a.blobId)?.blobId
      const blobUrl = blobId ? `${aggregator}/v1/blobs/${blobId}` : undefined

      const res = await explain.mutateAsync({
        actions,
        question,
        nodeId: selectedNode?.id,
        walrusAggregator: aggregator,
        memories,
        blobContent,
      })
      setMessages((prev) => [...prev, { role: "ai", text: res.answer, blobUrl }])
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Failed to get a response. Try again." }])
    }
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
      <div className="flex-1 relative overflow-hidden">
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

            <div style={{ position: "absolute", inset: 0 }}>
              <AgentGraph
                nodes={filteredNodes}
                edges={filteredEdges}
                onNodeClick={handleNodeSelect}
              />
            </div>
          </>
        )}
      </div>

      {/* AI Chat Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            key="ai-panel"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring" as const, stiffness: 280, damping: 28 }}
            className="w-[380px] shrink-0 flex flex-col overflow-hidden border-l border-border/60 relative z-10"
            style={{ height: "calc(100vh - 56px)", background: "linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%)" }}
          >
            {/* Node pill */}
            <div className="px-4 pt-4 pb-3 border-b border-border/40 shrink-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ActionTypeIcon type={selectedNode.type as ActionLog["actionType"]} />
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{TYPE_LABELS[selectedNode.type] ?? "Action"}</span>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded hover:bg-muted/40">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-sm text-foreground leading-snug mb-2">{selectedNode.label}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(selectedNode.ts), { addSuffix: true })}</span>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-mono ${
                  selectedNode.anchored ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                }`}>
                  <span className={`h-1 w-1 rounded-full ${selectedNode.anchored ? "bg-green-400" : "bg-yellow-400"}`} />
                  {selectedNode.anchored ? "Anchored" : "Pending"}
                </span>
                {selectedNode.blobId && (
                  <button onClick={() => openBlob(selectedNode.blobId!)} className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors font-mono">
                    <ExternalLink className="h-3 w-3" />Blob
                  </button>
                )}
              </div>
            </div>

            {/* AI header */}
            <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-xs font-mono text-foreground">Cognito AI</span>
                <span className="text-xs text-muted-foreground">· {filteredNodes.length} actions in context</span>
              </div>
              {messages.length > 0 && (
                <button onClick={() => setMessages([])} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Clear
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
              {messages.length === 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground/60 text-center mb-4">Click a suggestion or ask anything</p>
                  {[
                    "Summarize what this blob contains",
                    "What security risks exist in this session?",
                    "Why did the agent make this decision?",
                    "What does MemWal remember about this?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setChatInput(q)}
                      className="w-full text-left text-xs px-3 py-2.5 rounded-xl border border-border/40 bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground hover:text-foreground transition-all duration-200 leading-relaxed"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  {msg.role === "user" ? (
                    <div className="max-w-[88%] bg-white/[0.08] border border-white/[0.06] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm text-foreground leading-relaxed">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="max-w-[96%] space-y-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
                          <Sparkles className="h-2 w-2 text-white" />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">Cognito AI</span>
                      </div>
                      <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-sm px-3.5 py-3 text-sm text-foreground leading-relaxed prose prose-invert prose-sm max-w-none space-y-2">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed text-foreground/90">{children}</p>,
                            strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                            li: ({ children }) => <li className="text-sm text-foreground/90 mb-1">{children}</li>,
                            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                            code: ({ children }) => <code className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono text-green-400">{children}</code>,
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                        {msg.blobUrl && (
                          <a
                            href={msg.blobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg transition-all mt-2 font-mono no-underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View raw blob on Walrus
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {explain.isPending && (
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="h-2 w-2 text-white" />
                  </div>
                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "120ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "240ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleAsk} className="p-3 border-t border-border/40 shrink-0">
              <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-white/20 transition-colors">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about this agent flow..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={explain.isPending || !chatInput.trim()}
                  className="w-7 h-7 rounded-lg bg-violet-500 hover:bg-violet-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shrink-0"
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
