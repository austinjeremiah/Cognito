export interface Agent {
  id: string
  name: string
  createdAt: number
  totalSessions: number
  totalActions?: number
  lastActive?: number
}

export interface Session {
  id: string
  agentId: string
  startedAt: number
  endedAt?: number
  actionCount: number
  blobId?: string
  mainnetTxDigest?: string
  suiVisionUrl?: string
}

export interface ActionLog {
  id: string
  sessionId: string
  agentId: string
  ts: number
  actionType: "code_write" | "decision" | "api_call" | "web_search" | "tool_use" | "other"
  description: string
  blobId?: string
  parentActionId?: string
  metadata?: Record<string, unknown>
}

export interface VerifyProof {
  actionId: string
  status: "verified" | "tampered" | "unanchored"
  steps: {
    blobFetched: boolean
    hashMatchesBlobId: boolean
    onChainEventFound: boolean
    onChainBlobIdMatches: boolean
  }
  recomputedBlobId?: string
  onChainBlobId?: string
  mainnetTxDigest?: string
  suiVisionUrl?: string
}

export interface Stats {
  totalAgents: number
  totalSessions: number
  totalActions: number
  totalAnchors: number
}

export interface GraphData {
  nodes: { id: string; actionType: string; description: string; ts: number }[]
  links: { source: string; target: string }[]
}
