import dotenv from 'dotenv';
dotenv.config();

import { demoAgent } from '../mastra/agent';

const AGENT_ID   = 'cognito-demo-agent';
const AGENT_NAME = 'Cognito Live Demo Agent';
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

async function runDemo() {
  console.log('\n🎬 Cognito LIVE DEMO — Smart Contract Security Auditor\n');
  console.log('   (5 tool calls: log×3 → verify → end_session)\n');

  const { sessionId, agentId } = await startSession();
  console.log(`✅ Session: ${sessionId}`);
  console.log(`   Agent:   ${agentId}\n`);
  console.log('🤖 Agent running...\n');

  const prompt = `
sessionId: ${sessionId}
agentId: ${agentId}

Run the 5-step live demo now. Call each tool once in order.
`;

  let result: any;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      result = await demoAgent.generate(prompt, { maxSteps: 10 } as any);
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

  console.log('\n✅ Demo complete!\n');
  console.log('─'.repeat(60));
  console.log(result.text);
  console.log('─'.repeat(60));
  console.log(`\n📊 Graph:   GET /api/graph/${AGENT_ID}`);
  console.log(`📋 History: GET /api/history/${AGENT_ID}`);
  console.log(`   Session: ${sessionId}\n`);
}

runDemo().catch((err) => {
  console.error('❌ Demo failed:', err.message);
  process.exit(1);
});
