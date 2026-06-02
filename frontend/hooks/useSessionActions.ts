import { useQuery } from "@tanstack/react-query"
import { api } from "@/app/lib/api"
import type { ActionLog } from "@/app/types"

interface SessionActionsResponse {
  sessionId: string
  actions: ActionLog[]
}

export function useSessionActions(sessionId: string) {
  return useQuery<ActionLog[]>({
    queryKey: ["session-actions", sessionId],
    queryFn: async () => {
      const r = await api.get<SessionActionsResponse>(`/session/${sessionId}/actions`)
      return r.actions ?? []
    },
    enabled: !!sessionId,
    staleTime: 10_000,
  })
}
