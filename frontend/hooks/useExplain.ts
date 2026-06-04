"use client"

import { useMutation } from "@tanstack/react-query"
import { api } from "@/app/lib/api"

interface ExplainAction {
  id: string
  actionType: string
  description: string
  ts: number
  blobId?: string
  parentActionId?: string
}

interface ExplainRequest {
  actions: ExplainAction[]
  question: string
  nodeId?: string
  walrusAggregator?: string
  memories?: string[]
  blobContent?: Record<string, unknown>[]
}

interface ExplainResponse {
  answer: string
}

export function useExplain() {
  return useMutation({
    mutationFn: (body: ExplainRequest) =>
      api.post<ExplainResponse>("/explain", body),
  })
}
