Cognito Backend — Final Build Plan
Phase 1 — Foundation
tsconfig.json → src/types/ActionLog.ts → src/types/SuiTypes.ts → src/types/errors.ts → src/utils/logger.ts → src/utils/retry.ts → src/config.ts (Zod env validation) → src/index.ts (Fastify boot) → src/routes/health.ts

Done when: npm run dev starts, GET /api/health returns { status: "ok" }
Then: Create Phase1.md

Phase 2 — Services
TatumRPCService.ts (mainnet + testnet clients, two API keys) → WalrusService.ts (writeBlob, readBlob, writeBatch, computeBlobId) → CacheService.ts (Redis) → ActionQueueService.ts (in-memory queue) → SuiSQLService.ts (init + 3 tables: agents, sessions, actions)

Done when: SuiSQL initializes on testnet, DB object ID printed, Walrus testnet write + read confirmed
Then: Create Phase2.md

Phase 3 — Core Routes + Queue
src/middleware/auth.ts → src/middleware/errorHandler.ts → POST /api/session/start → POST /api/log → GET /api/history/:agentId → GET /api/blob/:blobId → src/jobs/walrusBatchJob.ts (30s cron)

Done when: Log an action → SuiSQL has it immediately → 30s later Walrus blobId appears on the record
Then: Create Phase3.md

Phase 4 — Anchor + Verify
src/move/agent_ledger.move → deploy to Sui mainnet → SuiAnchorService.ts → POST /api/session/end (flush queue + anchor tx) → VerifyService.ts (4-step proof chain) → GET /api/verify/:actionId

Done when: End a session → real mainnet tx digest returned → verify it on SuiVision → GET /api/verify/:actionId returns all 4 green steps
Then: Create Phase4.md

Phase 5 — Middleware + Security + Polish
Rate limiting on /api/log (30 req/min) → CORS config → GET /api/stats (dashboard counts) → GET /api/graph/:agentId (nodes + edges with additionalParents) → GET /api/agents (agent list) → GET /api/sessions/:agentId → stress test with 50+ actions

Done when: All routes secured, graph endpoint returns proper DAG structure with edges
Then: Create Phase5.md

Phase 6 — Mastra Agent + Demo
logActionTool.ts → queryHistoryTool.ts → readBlobTool.ts → verifyActionTool.ts → endSessionTool.ts → mastra/index.ts → agent.ts (Smart Contract Security Auditor — 18 actions, DAG structure) → full end-to-end demo run

Done when: Agent runs full audit of agent_ledger.move → 18 actions logged → knowledge graph is a proper web → mainnet anchor tx fires → verify_action confirms untampered → SuiVision link works
Then: Create Phase6.md

Summary
Phase	What	Key milestone
1	Foundation	Server boots, health route works
2	Services	SuiSQL + Walrus + Redis confirmed working
3	Core Routes	Log → SuiSQL → Walrus pipeline live
4	Anchor + Verify	Real mainnet tx + 4-step proof works
5	Polish + Graph	All routes secured, DAG endpoint ready
6	Mastra Agent	Full demo runs end-to-end


Set active environment to testnet
╭──────────────────────────────────────────────────────────────────────────────────────────╮
│ Created new keypair and saved it to keystore.                                            │
├────────────────┬─────────────────────────────────────────────────────────────────────────┤
│ alias          │ bold-sphene                                                             │
│ address        │ 0xf5adcfac9f46de1e976d9871f14fa2b758bf36aea42e2ef56d6c58ddecdf10fb      │
│ keyScheme      │ ed25519                                                                 │
│ recoveryPhrase │ you manage client detail dune dawn will dad image infant another result │
╰────────────────┴─────────────────────────────────────────────────────────────────────────╯
cognito-backend $ 


cognito-backend $ sui keytool export --key-identity 0x836fb864c8a5fd7bedadd80349f94408ff7093501e640d50fa2232d2e0c17995


╭────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────╮
│ exportedPrivateKey │  suiprivkey1qqwyfgg30nc2ztrz387pv3trehge2xxfwvutf22skg2yh5452fdlz3p4qsl                    │
│ key                │ ╭─────────────────┬──────────────────────────────────────────────────────────────────────╮ │
│                    │ │ alias           │  friendly-jet                                                        │ │
│                    │ │ suiAddress      │  0x836fb864c8a5fd7bedadd80349f94408ff7093501e640d50fa2232d2e0c17995  │ │
│                    │ │ publicBase64Key │  ANiedoxMsRkAZnTEbTzcw6xtB9gkbIdxTsT4oTTyqwjd                        │ │
│                    │ │ keyScheme       │  ed25519                                                             │ │
│                    │ │ flag            │  0                                                                   │ │
│                    │ │ peerId          │  d89e768c4cb119006674c46d3cdcc3ac6d07d8246c87714ec4f8a134f2ab08dd    │ │
│                    │ ╰─────────────────┴──────────────────────────────────────────────────────────────────────╯ │
╰────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────╯
cognito-backend $ 
