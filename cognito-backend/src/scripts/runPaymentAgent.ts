import dotenv from 'dotenv';
dotenv.config();

import { threatIntelAgent } from '../mastra/agent';
import { recall } from '../services/MemWalService';

const AGENT_ID   = 'cognito-threat-intel-agent';
const AGENT_NAME = 'Threat Intelligence Agent';
const API_BASE   = `http://localhost:${process.env.PORT ?? 3001}`;
const API_KEY    = process.env.COGNITO_API_KEY ?? '';

async function startSession(): Promise<{ sessionId: string; agentId: string }> {
  const res = await fetch(`${API_BASE}/api/session/start`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ agentId: AGENT_ID, agentName: AGENT_NAME }),
  });
  if (!res.ok) throw new Error(`Failed to start session: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ sessionId: string; agentId: string }>;
}

async function runPaymentAgent() {
  console.log('\n💳 Cognito x402 THREAT INTEL AGENT\n');
  console.log('   Recall → x402 payment → audit → anchor\n');
  console.log('─'.repeat(60));

  // Check MemWal for past purchases before agent runs
  console.log('\n🧠 Checking MemWal for cached threat intel...');
  const memories = await recall('threat intelligence agent_ledger.move purchase', 3);

  if (memories.length > 0) {
    console.log(`\n✅ MemWal found ${memories.length} relevant past memories:`);
    memories.forEach((m, i) => {
      console.log(`   ${i + 1}. [${(m.distance * 100).toFixed(0)}% match] ${m.text.slice(0, 80)}...`);
    });
    console.log('\n   Agent will be context-aware of past purchases.\n');
  } else {
    console.log('   No past purchases found — agent will make a fresh payment.\n');
  }

  const { sessionId, agentId } = await startSession();
  console.log(`✅ Session: ${sessionId}`);
  console.log(`   Agent:   ${agentId}\n`);
  console.log('🤖 Agent running (9 steps: decision → recall-check → x402 payment → findings → synthesis → verify → end)...\n');

  // Prepend memory context to prompt if available
  const memoryContext = memories.length > 0
    ? `\nPast MemWal context (do NOT buy again if data is fresh):\n${memories.map(m => `- ${m.text}`).join('\n')}\n`
    : '\nNo past purchases in MemWal — this is a fresh run.\n';

  const prompt = `
sessionId: ${sessionId}
agentId: ${agentId}
${memoryContext}
Run the 9-step threat intelligence workflow now. Use exact IDs returned by each tool.
`;

  let result: any;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      result = await threatIntelAgent.generate(prompt, { maxSteps: 15 } as any);
      break;
    } catch (err: any) {
      const isRateLimit = err?.message?.includes('Rate limit') || err?.message?.includes('429');
      if (isRateLimit && attempt < 3) {
        console.log(`⏳ Rate limited — waiting 65s (attempt ${attempt}/3)...`);
        await new Promise(r => setTimeout(r, 65_000));
      } else {
        throw err;
      }
    }
  }

  console.log('\n✅ Agent complete!\n');
  console.log('─'.repeat(60));
  console.log(result?.text ?? '');
  console.log('─'.repeat(60));

  console.log(`
📊 Graph:   GET /api/graph/${AGENT_ID}
📋 History: GET /api/history/${AGENT_ID}
   Session: ${sessionId}

💡 Run again — MemWal will recall the purchase and agent skips re-buying.
`);
}

runPaymentAgent().catch((err) => {
  console.error('❌ Payment agent failed:', err.message);
  process.exit(1);
});
