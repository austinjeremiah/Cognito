import { useQuery } from "@tanstack/react-query"
import { api } from "@/app/lib/api"
import type { ActionLog } from "@/app/types"

interface HistoryResponse {
  agentId: string
  actions: ActionLog[]
  source: string
}

export function useActionHistory(agentId?: string, limit = 20) {
  const path = agentId
    ? `/history/${agentId}?limit=${limit}`
    : `/history/all?limit=${limit}`

  return useQuery<ActionLog[]>({
    queryKey: ["history", agentId, limit],
    queryFn: async () => {
      const r = await api.get<HistoryResponse>(path)
      return r.actions ?? []
    },
    refetchInterval: 5_000,
    staleTime: 3_000,
  })
}
