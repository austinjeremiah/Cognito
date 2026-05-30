Cognito Frontend — Final Build Plan
Phase 1 — Foundation
Next.js 14 init → Tailwind + shadcn/ui → next.config.ts (output: 'export' for Walrus Sites) → src/types/index.ts (shared types matching backend) → src/lib/api.ts (typed fetch wrapper with x-api-key) → src/lib/utils.ts (cn(), formatTs(), truncateAddress()) → src/store/appStore.ts (Zustand) → Root layout + Navbar + Sidebar → QueryClientProvider setup

Done when: npm run dev loads a blank layout with working nav
Then: Create Phase1.md

Phase 2 — Core Component Library
TxBadge.tsx (SuiVision link) → BlobLink.tsx (Walrus aggregator link) → NetworkBadge.tsx (mainnet/testnet pill) → ActionTypeIcon.tsx (color-coded by type) → SessionStatus.tsx (Active / Anchored / Pending) → StatsCard.tsx → VerifyPanel.tsx (4-step integrity proof UI) → AgentBadge.tsx

Done when: All components render correctly in isolation (can test with hardcoded props)
Then: Create Phase2.md

Phase 3 — Dashboard + Agent List
useAgents.ts hook → useSessions.ts hook → /dashboard page (stats + activity feed + "Run Demo" button + NetworkBadge) → /agents page (card grid, search filter) → AgentCard.tsx

Done when: Dashboard shows real counts from backend, agent list populates from GET /api/agents
Then: Create Phase3.md

Phase 4 — Agent Detail + Session Detail
useActionHistory.ts hook → /agents/:agentId page (Timeline tab + Sessions tab + Raw Blobs tab) → SessionTimeline.tsx → ActionEntry.tsx → ActionDetail.tsx (drawer with raw JSON) → /sessions/:sessionId page → Mainnet Anchor Panel (TxBadge hero + SuiVision button + BlobLink) → VerifyPanel wired to GET /api/verify/:actionId (the money shot)

Done when: Open a session → see all actions → click Verify → all 4 green checks animate in → click SuiVision link → real tx visible
Then: Create Phase4.md

Phase 5 — Knowledge Graph
useBlob.ts hook → GET /api/graph/:agentId wired up → /graph/:agentId page → AgentGraph.tsx (react-force-graph) → node colors by action_type → multi-parent edges from additionalParents → session selector dropdown → node click → ActionDetail sidebar panel → zoom/reset controls

Done when: Run demo agent → open graph → see 18-node DAG web with convergence point at Action 14 and cross-edge from Action 16
Then: Create Phase5.md

Phase 6 — Walrus Sites Deploy
Audit all pages for static export compatibility (no server components doing data fetching) → fix any dynamic route issues with generateStaticParams → npm run build → install site-builder CLI → author sites-config.yaml → site-builder publish ./out --epochs 100 → capture .walrus.site URL → update .env → confirm dashboard loads at <id>.walrus.site

Done when: Full demo works from the .walrus.site URL — no localhost, no Vercel
Then: Create Phase6.md

Summary
Phase	What	Key milestone
1	Foundation	Blank layout loads with nav
2	Components	All UI building blocks ready
3	Dashboard + Agents	Real data from backend populates
4	Agent + Session Detail	Verify panel works end-to-end
5	Knowledge Graph	18-node DAG web renders
6	Walrus Sites	Demo opens from .walrus.site
