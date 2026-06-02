import { useQuery } from "@tanstack/react-query"
import { api } from "@/app/lib/api"
import type { Agent } from "@/app/types"

interface AgentsResponse {
  agents: {
    id: string
    name: string
    created_at: number
    total_sessions: number
    total_actions?: number
    last_active?: number
  }[]
  source: string
}

export function useAgents() {
  return useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const r = await api.get<AgentsResponse>("/agents")
      return r.agents.map((a) => ({
        id: a.id,
        name: a.name,
        createdAt: a.created_at,
        totalSessions: a.total_sessions,
        totalActions: a.total_actions,
        lastActive: a.last_active,
      }))
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}
