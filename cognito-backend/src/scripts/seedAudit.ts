import dotenv from 'dotenv';
dotenv.config();

const API_BASE = `http://localhost:${process.env.PORT ?? 3001}`;
const API_KEY = process.env.COGNITO_API_KEY ?? '';
const AGENT_ID = 'cognito-security-auditor';
const AGENT_NAME = 'Smart Contract Security Auditor';

async function post(path: string, body: object) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<any>;
}

async function log(sessionId: string, actionType: string, description: string, parentActionId?: string, metadata?: object) {
  const result = await post('/api/log', { sessionId, agentId: AGENT_ID, actionType, description, parentActionId, metadata });
  console.log(`  ✓ [${actionType}] ${description.slice(0, 60)} → ${result.actionId}`);
  return result.actionId as string;
}

async function run() {
  console.log('\n🚀 Cognito — Smart Contract Security Auditor (Seeded)\n');

  const { sessionId } = await post('/api/session/start', { agentId: AGENT_ID, agentName: AGENT_NAME });
  console.log(`✅ Session: ${sessionId}\n`);
  console.log('📝 Logging 20 audit actions...\n');

  // ── PARSE PHASE ──
  const a1  = await log(sessionId, 'tool_use',   'Start audit session for agent_ledger.move');
  const a2  = await log(sessionId, 'code_write', 'Parse agent_ledger.move — extract module, structs, entry functions', a1);
  const a3  = await log(sessionId, 'decision',   'Module structure identified: cognito::agent_ledger', a2);
  const a4  = await log(sessionId, 'decision',   'Entry functions identified: anchor_session()', a2);
  const a5  = await log(sessionId, 'decision',   'Structs identified: SessionAnchored event with 7 fields', a2);

  // ── CHECK PHASE ──
  const a6  = await log(sessionId, 'code_write', 'Checking access control on anchor_session', a4);
  const a7  = await log(sessionId, 'code_write', 'Checking gas profile — loops, dynamic dispatch', a4);
  const a8  = await log(sessionId, 'code_write', 'Checking timestamp source — epoch_timestamp_ms vs Clock', a4);
  const a9  = await log(sessionId, 'code_write', 'Checking event field completeness — SessionAnchored struct', a5);

  // ── FINDINGS PHASE ──
  const a10 = await log(sessionId, 'decision',   'FINDING #1 MEDIUM: anchor_session is public entry, no capability guard. Anyone can emit SessionAnchored for any agent_id. Recommend: add signer whitelist.', a6, { severity: 'MEDIUM' });
  const a11 = await log(sessionId, 'decision',   'FINDING #2 PASS: No loops, no dynamic dispatch, single event emit. Gas is predictable and minimal.', a7, { severity: 'PASS' });
  const a12 = await log(sessionId, 'decision',   'FINDING #3 INFO: epoch_timestamp_ms used — coarse granularity. Acceptable for audit logs.', a8, { severity: 'INFO' });
  const a13 = await log(sessionId, 'decision',   'FINDING #4 PASS: All 7 event fields present. blob_id + suisql_object_id correctly captured. Provenance complete.', a9, { severity: 'PASS' });

  // ── SYNTHESIS PHASE (convergence node) ──
  const a14 = await log(sessionId, 'decision',   'Cross-referencing all findings: 1 MEDIUM, 2 PASS, 1 INFO. Audit score: 7.5/10. Contract is safe to deploy.', a10, {
    additionalParents: [a11, a12, a13],
    findings: { medium: 1, pass: 2, info: 1 },
    score: '7.5/10',
  });

  // ── VERIFICATION PHASE ──
  const a15 = await log(sessionId, 'tool_use',   'query_history: reviewing full audit chain to confirm no steps missed', a14);
  const a16 = await log(sessionId, 'tool_use',   'query_history confirmed: 15 actions logged. Audit chain complete.', a15);
  const a17 = await log(sessionId, 'tool_use',   'verify_action on Finding #1 (Action 10) — re-fetch blob from Walrus, recompute hash, match on-chain anchor', a16, {
    additionalParents: [a10],
    verifyTarget: a10,
  });
  const a18 = await log(sessionId, 'tool_use',   'verify_action result: blob fetched, hash matches blobId, session not yet anchored (unanchored — expected pre-session-end)', a17, {
    additionalParents: [a10],
    status: 'unanchored',
  });

  // ── REPORT PHASE ──
  const a19 = await log(sessionId, 'code_write', JSON.stringify({ findings: 4, critical: 0, medium: 1, pass: 2, info: 1, score: '7.5/10', verifiedIntegrity: true, auditedBy: AGENT_ID }), a18, {
    additionalParents: [a14],
    type: 'security_report',
  });

  // ── END SESSION → mainnet anchor ──
  console.log('\n⚓ Ending session → Sui testnet anchor...\n');
  const end = await post('/api/session/end', { sessionId });
  console.log(`✅ Session ended`);
  console.log(`   blobId:          ${end.blobId ?? '(pending Walrus batch)'}`);
  console.log(`   mainnetTxDigest: ${end.mainnetTxDigest ?? '(COGNITO_PACKAGE_ID not set)'}`);
  if (end.suiVisionUrl) console.log(`   SuiVision:       ${end.suiVisionUrl}`);

  console.log('\n─────────────────────────────────────────────────');
  console.log(`📊 Graph:   GET /api/graph/${AGENT_ID}`);
  console.log(`📋 History: GET /api/history/${AGENT_ID}`);
  console.log(`🔍 Verify:  GET /api/verify/${a10}`);
  console.log(`   Session: ${sessionId}`);
  console.log('─────────────────────────────────────────────────\n');
}

run().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
