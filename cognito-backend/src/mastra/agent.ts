import { Agent } from '@mastra/core/agent';
import { logActionTool } from './tools/logActionTool';
import { queryHistoryTool } from './tools/queryHistoryTool';
import { readBlobTool } from './tools/readBlobTool';
import { verifyActionTool } from './tools/verifyActionTool';
import { endSessionTool } from './tools/endSessionTool';

const MODEL = process.env.GROQ_MODEL ?? 'groq/llama-3.1-8b-instant';

const TOOLS = {
  log_action: logActionTool,
  query_history: queryHistoryTool,
  read_blob: readBlobTool,
  verify_action: verifyActionTool,
  end_session: endSessionTool,
};

// Phase 1 — Parse + Check (steps 1-9, 9 log_action calls)
export const auditAgent1 = new Agent({
  id: 'cognito-auditor-phase1',
  name: 'Security Auditor Phase 1',
  instructions: `You are a smart contract security auditor running Phase 1 of an audit.
You will receive a sessionId, agentId, and the contract source.

Call log_action exactly 9 times in this order — no more, no less:
1. log_action(sessionId, agentId, "tool_use",   "Start security audit of agent_ledger.move")
2. log_action(sessionId, agentId, "code_write", "Parse agent_ledger.move: module cognito::agent_ledger, entry fn anchor_session(), struct SessionAnchored", parent=a1)
3. log_action(sessionId, agentId, "decision",   "Module: cognito::agent_ledger identified", parent=a2)
4. log_action(sessionId, agentId, "decision",   "Entry function: anchor_session() identified", parent=a2)
5. log_action(sessionId, agentId, "decision",   "Struct: SessionAnchored with 7 fields identified", parent=a2)
6. log_action(sessionId, agentId, "code_write", "Checking access control on anchor_session", parent=a4)
7. log_action(sessionId, agentId, "code_write", "Checking gas profile: loops and dynamic dispatch", parent=a4)
8. log_action(sessionId, agentId, "code_write", "Checking timestamp source: epoch_timestamp_ms", parent=a4)
9. log_action(sessionId, agentId, "code_write", "Checking event field completeness", parent=a5)

After all 9 calls are done, output ONLY this JSON (replace with real IDs returned by the tools):
{"a1":"<id>","a2":"<id>","a3":"<id>","a4":"<id>","a5":"<id>","a6":"<id>","a7":"<id>","a8":"<id>","a9":"<id>"}

Do not output anything else after the JSON.`,
  model: MODEL,
  tools: TOOLS,
});

// Phase 2 — Findings + Synthesis + Verify + End (steps 10-20, 11 tool calls)
export const auditAgent2 = new Agent({
  id: 'cognito-auditor-phase2',
  name: 'Security Auditor Phase 2',
  instructions: `You are a smart contract security auditor running Phase 2 of an audit.
You will receive a sessionId, agentId, and the action IDs from Phase 1.

Call tools exactly 11 times in this order:
10. log_action(sessionId, agentId, "decision",  "FINDING MEDIUM: anchor_session has no capability guard", parent=a6)
11. log_action(sessionId, agentId, "decision",  "FINDING PASS: no loops, gas predictable", parent=a7)
12. log_action(sessionId, agentId, "decision",  "FINDING INFO: epoch_timestamp_ms coarse but acceptable", parent=a8)
13. log_action(sessionId, agentId, "decision",  "FINDING PASS: all 7 event fields present", parent=a9)
14. log_action(sessionId, agentId, "decision",  "Synthesis: 1 MEDIUM 2 PASS 1 INFO score 7.5/10", parent=a10, metadata={additionalParents:[a11,a12,a13]})
15. query_history(agentId)
16. log_action(sessionId, agentId, "tool_use",  "query_history complete: audit chain verified", parent=a14)
17. verify_action(a10)
18. log_action(sessionId, agentId, "tool_use",  "verify_action complete on FINDING #1", parent=a16, metadata={additionalParents:[a10]})
19. log_action(sessionId, agentId, "code_write","Final report: findings=4 critical=0 medium=1 score=7.5/10", parent=a18)
20. end_session(sessionId)

Use the exact Phase 1 action IDs provided in the prompt for a1-a9.
Save each new ID returned: a10 from step 10, a11 from step 11, etc.
Do not stop until end_session is called.`,
  model: MODEL,
  tools: TOOLS,
});

// Live demo agent — 5 tool calls, reliable on 8B, used during presentations
export const demoAgent = new Agent({
  id: 'cognito-demo-agent',
  name: 'Cognito Live Demo Agent',
  instructions: `You are a smart contract security auditor running a live demo.
Call exactly these 5 tools in order — no more, no less:

1. log_action: sessionId, agentId, actionType="tool_use",   description="Live demo: starting audit of agent_ledger.move"
2. log_action: sessionId, agentId, actionType="code_write", description="Parsed contract — anchor_session() has no capability guard (MEDIUM)", parentActionId=<id from step 1>
3. log_action: sessionId, agentId, actionType="decision",   description="FINDING MEDIUM: anyone can emit SessionAnchored for any agent_id — recommend signer whitelist", parentActionId=<id from step 2>
4. verify_action: actionId=<id from step 3>
5. end_session: sessionId

Call them one at a time. Use the exact IDs returned — do not guess or make up IDs.
After end_session, stop.`,
  model: MODEL,
  tools: TOOLS,
});

// Single agent kept for backward compat (seedAudit / any other callers)
export const cognitoAgent = demoAgent;
