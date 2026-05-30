import dotenv from 'dotenv';
dotenv.config();

import { cognitoAgent } from '../mastra/agent';

const AGENT_ID = 'cognito-security-auditor';
const AGENT_NAME = 'Smart Contract Security Auditor';
const API_BASE = `http://localhost:${process.env.PORT ?? 3001}`;
const API_KEY = process.env.COGNITO_API_KEY ?? '';

async function startSession(): Promise<{ sessionId: string; agentId: string }> {
  const res = await fetch(`${API_BASE}/api/session/start`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ agentId: AGENT_ID, agentName: AGENT_NAME }),
  });
  if (!res.ok) throw new Error(`Failed to start session: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ sessionId: string; agentId: string }>;
}

async function runDemo() {
  console.log('\n🚀 Cognito Demo — Smart Contract Security Auditor\n');

  const { sessionId, agentId } = await startSession();
  console.log(`✅ Session started: ${sessionId}`);
  console.log(`   Agent: ${agentId}\n`);

  const prompt = `
Audit agent_ledger.move — the Sui Move contract that Cognito uses to anchor AI agent sessions on mainnet.

Your session ID is: ${sessionId}
Your agent ID is: ${agentId}

Follow your instructions exactly. Log every action. Build the full 18-20 action DAG.
Start with action 1 (log the audit start) and work through all phases.
End with end_session to anchor this audit permanently to Sui mainnet.

The contract source:
\`\`\`move
module cognito::agent_ledger {
    use sui::event;
    use std::string::String;

    public struct SessionAnchored has copy, drop {
        session_id: String,
        agent_id: String,
        agent_name: String,
        action_count: u64,
        blob_id: String,
        suisql_object_id: address,
        timestamp: u64,
    }

    public entry fun anchor_session(
        session_id: String,
        agent_id: String,
        agent_name: String,
        action_count: u64,
        blob_id: String,
        suisql_object_id: address,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        event::emit(SessionAnchored {
            session_id,
            agent_id,
            agent_name,
            action_count,
            blob_id,
            suisql_object_id,
            timestamp: sui::tx_context::epoch_timestamp_ms(ctx),
        });
    }
}
\`\`\`

Begin the audit now.
`;

  console.log('🤖 Starting audit agent...\n');

  const result = await cognitoAgent.generate(prompt);

  console.log('\n✅ Audit complete!\n');
  console.log('─'.repeat(60));
  console.log(result.text);
  console.log('─'.repeat(60));
  console.log('\n📊 View graph: GET /api/graph/cognito-security-auditor');
  console.log(`📋 View history: GET /api/history/${agentId}`);
}

runDemo().catch((err) => {
  console.error('❌ Demo failed:', err.message);
  process.exit(1);
});
