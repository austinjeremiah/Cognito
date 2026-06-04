"use client"

import { useMutation } from "@tanstack/react-query"
import { api } from "@/app/lib/api"

interface ExplainAction {
  id: string
  actionType: string
  description: string
  ts: number
  parentActionId?: string
}

interface ExplainRequest {
  actions: ExplainAction[]
  question: string
  nodeId?: string
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
