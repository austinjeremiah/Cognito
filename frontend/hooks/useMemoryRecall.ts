"use client"

import { useMutation } from "@tanstack/react-query"
import { api } from "@/app/lib/api"

export interface MemoryResult {
  blob_id: string
  text: string
  distance: number
}

interface RecallResponse {
  results: MemoryResult[]
  total: number
}

export function useMemoryRecall() {
  return useMutation({
    mutationFn: ({ query, topK = 5 }: { query: string; topK?: number }) =>
      api.get<RecallResponse>(`/memory/recall?q=${encodeURIComponent(query)}&topK=${topK}`),
  })
}
