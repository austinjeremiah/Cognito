import { useQuery } from "@tanstack/react-query"
import { api } from "@/app/lib/api"
import type { Session } from "@/app/types"

interface SessionResponse {
  id: string
  agentId: string
  startedAt: number
  endedAt?: number
  actionCount: number
  blobId?: string
  mainnetTxDigest?: string
  suiVisionUrl?: string
}

export function useSessions(sessionId?: string) {
  return useQuery<Session>({
    queryKey: ["session", sessionId],
    queryFn: () => api.get<Session>(`/session/${sessionId}`),
    enabled: !!sessionId,
    staleTime: 15_000,
  })
}
