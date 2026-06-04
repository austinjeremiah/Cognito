import { Agent } from '@mastra/core/agent';
import { logActionTool } from './tools/logActionTool';
import { queryHistoryTool } from './tools/queryHistoryTool';
import { readBlobTool } from './tools/readBlobTool';
import { verifyActionTool } from './tools/verifyActionTool';
import { endSessionTool } from './tools/endSessionTool';
import { makePaymentTool } from './tools/makePaymentTool';

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
The metadata parameter for log_action must always be a JSON string. Pass "{}" if you have no metadata.
Call exactly these 5 tools in order — no more, no less:

1. log_action: sessionId, agentId, actionType="tool_use",   description="Live demo: starting audit of agent_ledger.move", parentActionId="", metadata="{}"
2. log_action: sessionId, agentId, actionType="code_write", description="Parsed contract — anchor_session() has no capability guard (MEDIUM)", parentActionId=<id from step 1>, metadata="{}"
3. log_action: sessionId, agentId, actionType="decision",   description="FINDING MEDIUM: anyone can emit SessionAnchored for any agent_id — recommend signer whitelist", parentActionId=<id from step 2>, metadata="{}"
4. verify_action: actionId=<id from step 3>
5. end_session: sessionId

Call them one at a time. Use the exact IDs returned — do not guess or make up IDs.
After end_session, stop.`,
  model: MODEL,
  tools: TOOLS,
});

// Single agent kept for backward compat (seedAudit / any other callers)
export const cognitoAgent = demoAgent;

// Threat Intelligence Agent — x402 micropayment + MemWal recall + Cognito audit
export const threatIntelAgent = new Agent({
  id: 'cognito-threat-intel-agent',
  name: 'Threat Intelligence Agent',
  instructions: `You are a smart contract threat intelligence agent that buys and audits premium security data.
You have these tools: log_action, make_payment, verify_action, end_session.

For log_action the metadata parameter must be a JSON string like "{}" or "{\\"key\\":\\"value\\"}".

Call tools in EXACTLY this order — no more, no less:

1. log_action: sessionId, agentId, actionType="decision",
   description="Initiating threat intelligence purchase for agent_ledger.move contract",
   parentActionId="", metadata="{}"

2. log_action: sessionId, agentId, actionType="decision",
   description="MemWal checked — no cached threat data found. Proceeding with x402 micropayment.",
   parentActionId=<id from step 1>, metadata="{}"

3. make_payment: url="http://localhost:3001/api/premium/threat-intel",
   description="Purchase threat intelligence for agent_ledger.move via x402"

4. log_action: sessionId, agentId, actionType="api_call",
   description="x402 payment complete — $0.001 paid on base-sepolia. Received 4 findings: 1 HIGH 1 MEDIUM 1 LOW 1 INFO",
   parentActionId=<id from step 2>, metadata="{\\"amountPaid\\":\\"0.001\\",\\"network\\":\\"base-sepolia\\"}"

5. log_action: sessionId, agentId, actionType="decision",
   description="FINDING HIGH TI-001: Reentrancy in anchor_session() — external call before state update. Priority fix.",
   parentActionId=<id from step 4>, metadata="{}"

6. log_action: sessionId, agentId, actionType="decision",
   description="FINDING MEDIUM TI-002: Missing signer whitelist — anyone can emit SessionAnchored. Add capability guard.",
   parentActionId=<id from step 4>, metadata="{}"

7. log_action: sessionId, agentId, actionType="decision",
   description="SYNTHESIS: 2 critical issues found via paid threat intel. Score 6.5/10. Payment anchored to audit trail.",
   parentActionId=<id from step 5>, metadata="{\\"additionalParents\\":\\"<id from step 6>\\",\\"score\\":\\"6.5\\"}"

8. verify_action: actionId=<id from step 7>

9. end_session: sessionId

Use exact IDs returned by each tool. Do not skip steps. Stop after end_session.`,
  model: MODEL,
  tools: {
    log_action:   logActionTool,
    make_payment: makePaymentTool,
    verify_action: verifyActionTool,
    end_session:  endSessionTool,
  },
});
