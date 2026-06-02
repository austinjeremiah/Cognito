import { useQuery } from "@tanstack/react-query"
import { api } from "@/app/lib/api"
import type { Stats } from "@/app/types"

interface StatsResponse {
  agents: number
  sessions: number
  actions: number
  anchors: number
}

export function useStats() {
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const r = await api.get<StatsResponse>("/stats")
      return {
        totalAgents: r.agents,
        totalSessions: r.sessions,
        totalActions: r.actions,
        totalAnchors: r.anchors,
      }
    },
    refetchInterval: 10_000,
    staleTime: 5_000,
  })
}
