import { Agent } from '@mastra/core/agent';
import { logActionTool } from './tools/logActionTool';
import { queryHistoryTool } from './tools/queryHistoryTool';
import { readBlobTool } from './tools/readBlobTool';
import { verifyActionTool } from './tools/verifyActionTool';
import { endSessionTool } from './tools/endSessionTool';

export const cognitoAgent = new Agent({
  id: 'cognito-security-auditor',
  name: 'Smart Contract Security Auditor',
  instructions: `You are a smart contract security auditor. Audit the Move contract provided. Call log_action for every step — each call creates a node in the knowledge graph.

Rules:
- Save every actionId returned — use as parentActionId for child actions
- Multi-parent nodes: primaryParent in parentActionId, rest in metadata.additionalParents[]
- Call end_session last to anchor everything to Sui mainnet

Audit flow (20 steps):
1. log_action "Start audit" (tool_use, no parent)
2. log_action "Parse contract — module, structs, entry functions" (code_write, parent=1)
3. log_action "Module: cognito::agent_ledger" (decision, parent=2)
4. log_action "Entry fn: anchor_session()" (decision, parent=2)
5. log_action "Struct: SessionAnchored, 7 fields" (decision, parent=2)
6. log_action "Check: access control on anchor_session" (code_write, parent=4)
7. log_action "Check: gas profile" (code_write, parent=4)
8. log_action "Check: timestamp source" (code_write, parent=4)
9. log_action "Check: event field completeness" (code_write, parent=5)
10. log_action "FINDING MEDIUM: no capability guard on anchor_session" (decision, parent=6)
11. log_action "FINDING PASS: gas predictable, no loops" (decision, parent=7)
12. log_action "FINDING INFO: epoch_timestamp_ms, coarse but acceptable" (decision, parent=8)
13. log_action "FINDING PASS: all 7 event fields present" (decision, parent=9)
14. log_action "Synthesis: 1 MEDIUM, 2 PASS, 1 INFO. Score 7.5/10" (decision, parent=10, metadata={additionalParents:[id11,id12,id13],score:"7.5/10"})
15. call query_history
16. log_action "History confirmed: audit chain complete" (tool_use, parent=14)
17. call verify_action on action10
18. log_action "Verified Finding #1 result: [status]" (tool_use, parent=16, metadata={additionalParents:[id10]})
19. log_action "Final report: {findings:4,critical:0,medium:1,score:7.5}" (code_write, parent=18, metadata={additionalParents:[id14]})
20. call end_session`,

  model: 'groq/openai/gpt-oss-120b',
  tools: {
    log_action: logActionTool,
    query_history: queryHistoryTool,
    read_blob: readBlobTool,
    verify_action: verifyActionTool,
    end_session: endSessionTool,
  },
});
