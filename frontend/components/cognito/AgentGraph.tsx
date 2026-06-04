"use client"

import { useCallback, useRef } from "react"
import ForceGraph2D from "react-force-graph-2d"
import type { GraphNode, GraphEdge } from "@/hooks/useGraph"

const TYPE_COLORS: Record<string, string> = {
  tool_use:   "#2dd4bf",
  code_write: "#4ade80",
  decision:   "#fb923c",
  api_call:   "#c084fc",
  web_search: "#60a5fa",
  other:      "#6b7280",
}

interface AgentGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (node: GraphNode) => void
}

export function AgentGraph({ nodes, edges, onNodeClick }: AgentGraphProps) {
  const fgRef = useRef<any>(null)

  const nodeSet = new Set(nodes.map((n) => n.id))

  const graphData = {
    nodes: nodes.map((n) => ({
      ...n,
      color: TYPE_COLORS[n.type] ?? TYPE_COLORS.other,
    })),
    links: edges
      .filter((e) => nodeSet.has(e.source) && nodeSet.has(e.target))
      .map((e) => ({ source: e.source, target: e.target })),
  }

  const handleNodeClick = useCallback((node: any) => {
    if (node.blobId) {
      window.open(`/blob/${encodeURIComponent(node.blobId)}`, "_blank")
    }
    onNodeClick?.(node as GraphNode)
  }, [onNodeClick])

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const r = 6
    const color = node.color ?? TYPE_COLORS.other

    if (node.anchored) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + 3, 0, 2 * Math.PI)
      ctx.fillStyle = `${color}22`
      ctx.fill()
    }

    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
    ctx.fillStyle = `${color}cc`
    ctx.fill()

    if (globalScale >= 1.8) {
      const full = (node.label as string) ?? ""
      const label = full.length > 48 ? full.slice(0, 48) + "…" : full
      const fontSize = 11 / globalScale
      ctx.font = `${fontSize}px sans-serif`
      ctx.fillStyle = "#ffffffdd"
      ctx.textAlign = "center"
      ctx.fillText(label, node.x, node.y + r + fontSize + 3)
    }
  }, [])

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      nodeCanvasObject={nodeCanvasObject}
      nodeCanvasObjectMode={() => "replace"}
      onNodeClick={handleNodeClick}
      onNodeHover={() => {}}
      enableNodeDrag={false}
      linkColor={() => "#ffffff25"}
      linkWidth={1.5}
      linkDirectionalArrowLength={5}
      linkDirectionalArrowRelPos={1}
      linkDirectionalParticles={1}
      linkDirectionalParticleSpeed={0.004}
      backgroundColor="transparent"
      cooldownTicks={200}
      d3AlphaDecay={0.01}
      d3VelocityDecay={0.2}
      nodeRelSize={6}
    />
  )
}
