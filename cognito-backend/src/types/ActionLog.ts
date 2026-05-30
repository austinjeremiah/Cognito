export type ActionType =
  | 'code_write'
  | 'decision'
  | 'api_call'
  | 'web_search'
  | 'tool_use'
  | 'other';

export interface ActionLog {
  id: string;
  sessionId: string;
  agentId: string;
  ts: number;
  actionType: ActionType;
  description: string;
  blobId?: string;
  parentActionId?: string;
  metadata?: Record<string, unknown>;
}

export interface Session {
  id: string;
  agentId: string;
  startedAt: number;
  endedAt?: number;
  actionCount: number;
  blobId?: string;
  mainnetTxDigest?: string;
}

export interface AgentRecord {
  id: string;
  name: string;
  createdAt: number;
  totalSessions: number;
}
