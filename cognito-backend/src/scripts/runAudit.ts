import dotenv from 'dotenv';
dotenv.config();

import { auditAgent1, auditAgent2 } from '../mastra/agent';

const AGENT_ID   = 'cognito-security-auditor';
const AGENT_NAME = 'Smart Contract Security Auditor';
const API_BASE   = `http://localhost:${process.env.PORT ?? 3001}`;
const API_KEY    = process.env.COGNITO_API_KEY ?? '';

const CONTRACT_SOURCE = `
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
            session_id, agent_id, agent_name, action_count,
            blob_id, suisql_object_id,
            timestamp: sui::tx_context::epoch_timestamp_ms(ctx),
        });
    }
}`;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function startSession(): Promise<{ sessionId: string; agentId: string }> {
  const res = await fetch(`${API_BASE}/api/session/start`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ agentId: AGENT_ID, agentName: AGENT_NAME }),
  });
  if (!res.ok) throw new Error(`Failed to start session: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ sessionId: string; agentId: string }>;
}

// Extract the JSON block of action IDs from agent 1's text output
function parsePhase1Ids(text: string): Record<string, string> {
  const match = text.match(/\{[^{}]*"a1"[^{}]*\}/s);
  if (!match) throw new Error(`Could not parse Phase 1 action IDs from:\n${text}`);
  return JSON.parse(match[0]);
}

async function runWithRetry(agent: any, prompt: string, maxSteps: number): Promise<any> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      return await agent.generate(prompt, { maxSteps } as any);
    } catch (err: any) {
      const isRateLimit = err?.message?.includes('Rate limit') || err?.message?.includes('429');
      if (isRateLimit && attempt < 5) {
        const wait = 65;
        console.log(`⏳ Rate limited — waiting ${wait}s (attempt ${attempt}/5)...`);
        await sleep(wait * 1000);
      } else {
        throw err;
      }
    }
  }
}

async function runDemo() {
  console.log('\n🚀 Cognito Demo — Smart Contract Security Auditor (Two-Phase)\n');

  const { sessionId, agentId } = await startSession();
  console.log(`✅ Session started: ${sessionId}`);
  console.log(`   Agent: ${agentId}\n`);

  // ── PHASE 1: Steps 1-9 ────────────────────────────────────────
  console.log('🔍 Phase 1 — Parse + Check (steps 1-9)...\n');

  const phase1Prompt = `
sessionId: ${sessionId}
agentId: ${agentId}

Contract source:
\`\`\`move${CONTRACT_SOURCE}\`\`\`

Run Phase 1 now. Call log_action 9 times exactly as instructed, then output the JSON of action IDs.
`;

  const result1 = await runWithRetry(auditAgent1, phase1Prompt, 15);
  console.log('\n✅ Phase 1 complete.\n');

  let ids: Record<string, string>;
  try {
    ids = parsePhase1Ids(result1.text);
    console.log('📋 Phase 1 action IDs:', ids);
  } catch {
    // Fallback: fetch from history API
    console.log('⚠️  Could not parse IDs from text — fetching from history API...');
    const histRes = await fetch(`${API_BASE}/api/history/${agentId}?limit=9`, {
      headers: { 'x-api-key': API_KEY },
    });
    const actions = (await histRes.json()) as any[];
    ids = {};
    actions.slice(0, 9).reverse().forEach((a: any, i: number) => {
      ids[`a${i + 1}`] = a.id;
    });
    console.log('📋 Fetched IDs:', ids);
  }

  // ── 65s PAUSE — let Groq TPM window reset ─────────────────────
  console.log('\n⏳ Waiting 65s for Groq TPM reset before Phase 2...\n');
  for (let i = 65; i > 0; i -= 5) {
    process.stdout.write(`   ${i}s remaining...\r`);
    await sleep(5000);
  }
  console.log('\n');

  // ── PHASE 2: Steps 10-20 ──────────────────────────────────────
  console.log('🔬 Phase 2 — Findings + Synthesis + Verify + End (steps 10-20)...\n');

  const phase2Prompt = `
sessionId: ${sessionId}
agentId: ${agentId}

Phase 1 action IDs (use these exactly as parent IDs):
a1=${ids.a1}
a2=${ids.a2}
a3=${ids.a3}
a4=${ids.a4}
a5=${ids.a5}
a6=${ids.a6}
a7=${ids.a7}
a8=${ids.a8}
a9=${ids.a9}

Run Phase 2 now. Make all 11 tool calls in order (steps 10-20), using the above IDs as parent references.
`;

  const result2 = await runWithRetry(auditAgent2, phase2Prompt, 15);
  console.log('\n✅ Phase 2 complete — audit anchored to Sui!\n');

  console.log('─'.repeat(60));
  console.log(result2.text);
  console.log('─'.repeat(60));
  console.log('\n📊 View graph:   GET /api/graph/cognito-security-auditor');
  console.log(`📋 View history: GET /api/history/${agentId}`);
  console.log(`   Session:      ${sessionId}\n`);
}

runDemo().catch((err) => {
  console.error('❌ Demo failed:', err.message);
  process.exit(1);
});
