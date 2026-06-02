import { useQuery } from "@tanstack/react-query"
import { api } from "@/app/lib/api"

export interface GraphNode {
  id: string
  label: string
  type: string
  ts: number
  blobId?: string
  anchored: boolean
}

export interface GraphEdge {
  source: string
  target: string
}

interface GraphResponse {
  agentId: string
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export function useGraph(agentId: string) {
  return useQuery<GraphResponse>({
    queryKey: ["graph", agentId],
    queryFn: () => api.get<GraphResponse>(`/graph/${agentId}`),
    enabled: !!agentId,
    staleTime: 30_000,
  })
}
