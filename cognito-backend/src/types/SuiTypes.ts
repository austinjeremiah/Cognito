export interface SessionAnchoredEvent {
  session_id: string;
  agent_id: string;
  agent_name: string;
  action_count: string;
  blob_id: string;
  suisql_object_id: string;
  timestamp: string;
}

export interface AnchorResult {
  txDigest: string;
  suiVisionUrl: string;
}
