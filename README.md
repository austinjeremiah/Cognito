# Cognito

**Verifiable AI Agent Audit Trail — built on Walrus, Sui, and MemWal.**

Every action an AI agent takes is logged, stored tamper-proof on Walrus, indexed in SuiSQL, anchored on Sui blockchain, and recalled semantically via MemWal. Every claim is independently verifiable. No single party can alter or censor the record.

---

## Project Overview

Cognito solves the accountability gap in autonomous AI systems. As agents take consequential actions — trading, auditing, deploying code — there is no standard mechanism to prove what they did, when, and why. Cognito provides that proof layer: a cryptographically verifiable, decentralized audit trail for every agent decision.

The system operates across three trust layers:

- **Tamper detection** — Walrus blob IDs are content-addressed; any modification produces a different ID, making tampering mathematically detectable
- **Semantic recall** — MemWal embeds and indexes every action so agents recall relevant past context before acting
- **On-chain finality** — one Sui transaction per session anchors the Walrus blob ID permanently to the blockchain

---

## Core Features

- **Real-time action logging** — every tool call, API request, and decision captured as a structured JSON entry via Mastra instrumentation
- **Decentralized blob storage** — action batches written to Walrus as content-addressed blobs; blob ID serves as the cryptographic fingerprint
- **SuiSQL indexing** — structured SQL queries over agent history via a Walrus-persisted on-chain database
- **Sui mainnet anchoring** — one immutable `SessionAnchored` event per session, tying the blob ID to a permanent on-chain record
- **Semantic memory** — MemWal embeds and stores every action on Walrus; agents query past context via vector similarity before running
- **Knowledge graph** — agent sessions rendered as a directed acyclic graph; nodes are actions, edges are causal links
- **Cognito AI** — click any graph node and query an AI assistant that reads the actual Walrus blob content and MemWal memories to explain agent decisions
- **Integrity verification** — per-action proof flow: blob fetch → content check → on-chain event lookup → match confirmation
- **Live dashboard** — real-time stats, activity feed, and blob links across all registered agents

---

## Platform Capabilities

| Capability | Implementation |
|---|---|
| Agent action ingestion | `POST /api/log` — Mastra tool or direct API |
| Session lifecycle | `POST /api/session/start` · `POST /api/session/end` |
| Walrus blob storage | Batch write per session; blob ID returned and stored |
| Sui anchor | Single tx on session end via Tatum RPC |
| MemWal memory | Fire-and-forget write on every action; recall via semantic query |
| Graph generation | `GET /api/graph/:agentId` — nodes + edges derived from action log |
| AI explanation | `POST /api/explain` — Groq LLM with blob content + MemWal context |
| Integrity proof | `GET /api/verify/:actionId` — blob fetch + on-chain event lookup |
| Agent history | `GET /api/history/:agentId` — paginated action timeline |
| Stats | `GET /api/stats` — live agent, session, action, and anchor counts |

---

## Technical Architecture

```
Agent Runtime (Mastra)
        │
        ▼
  Cognito Backend (Fastify / Node.js)
        │
        ├── SuiSQL          — structured action index (Walrus-persisted, Sui-native)
        ├── Walrus           — decentralized blob storage (content-addressed)
        ├── Sui Mainnet      — session anchor transactions via Tatum RPC
        ├── MemWal           — semantic memory layer on Walrus
        └── Redis            — caching + background job queue
        │
        ▼
  Cognito Frontend (Next.js)
        │
        ├── Dashboard        — live stats, activity feed
        ├── Agents           — registered agents, timelines, memory
        ├── Graph            — force-directed DAG + Cognito AI chat
        └── Sessions         — session detail + integrity proof
```

**Data flow per agent action:**
1. Agent calls `logAction` tool → `POST /api/log`
2. Action written to SuiSQL; added to batch queue
3. Background job batches actions → writes to Walrus → stores blob ID
4. MemWal embeds action text → stores on Walrus (fire-and-forget)
5. On `session/end` → Sui anchor transaction fired via Tatum RPC
6. `SessionAnchored` on-chain event ties blob ID + SuiSQL record permanently

---

## Tech Stack

| Layer | Technology |
|---|---|
| Agent framework | Mastra |
| Backend | Fastify (Node.js / TypeScript) |
| Frontend | Next.js 15 (App Router) |
| Decentralized storage | Walrus (testnet) |
| On-chain database | SuiSQL |
| Blockchain | Sui (testnet anchor, mainnet-compatible) |
| RPC gateway | Tatum |
| Semantic memory | MemWal (`@mysten-incubation/memwal`) |
| AI inference | Groq (`llama-3.1-8b-instant`) |
| Cache / queue | Redis (ioredis) |
| Graph rendering | react-force-graph-2d |
| UI components | shadcn/ui + Tailwind CSS |

---

## Environment Variables

### Backend (`cognito-backend/.env`)

```env
# Server
NODE_ENV=production
PORT=3001

# Auth
COGNITO_API_KEY=<32-byte hex>

# Tatum RPC
TATUM_API_KEY=
TATUM_SUI_RPC_URL=https://sui-mainnet.gateway.tatum.io
TATUM_SUI_TESTNET_RPC_URL=https://sui-testnet.gateway.tatum.io

# Sui
SUI_PRIVATE_KEY=
SUI_ADDRESS=

# Walrus
WALRUS_PUBLISHER_URL=https://publisher.walrus-01.tududes.com
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

# SuiSQL
SUISQL_NETWORK=testnet
SUISQL_OBJECT_ID=

# MemWal
MEMWAL_PRIVATE_KEY=
MEMWAL_ACCOUNT_ID=
MEMWAL_SERVER_URL=https://relayer.memwal.ai

# Redis
REDIS_URL=redis://localhost:6379

# Groq
GROQ_API_KEY=
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_COGNITO_KEY=<same as COGNITO_API_KEY>
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
NEXT_PUBLIC_SUIVISION_BASE=https://testnet.suivision.xyz
```

---

## Deployment

### Backend

Requires Node.js 20+, Redis, and all environment variables set.

```bash
cd cognito-backend
npm install
npm run build
npm start
```

Recommended: deploy on **Render** or **Railway** with a Redis add-on.

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check: `GET /health`

### Frontend

```bash
cd frontend
pnpm install
pnpm run build
pnpm start
```

Deployed on **Vercel**. Set `NEXT_PUBLIC_API_URL` to the backend's public URL in Vercel environment variables, then redeploy.

---

## Monitoring & Operations

- **Health endpoint:** `GET /health` — returns backend status, SuiSQL state, and Redis connectivity
- **Stats endpoint:** `GET /api/stats` — live counts for agents, sessions, actions, and on-chain anchors
- **Logging:** Winston structured JSON logs across all routes and services
- **Rate limiting:** 100 requests/minute per IP via `@fastify/rate-limit`
- **Background jobs:** Walrus batch write runs every 30 seconds; processes queued actions in bulk
- **Redis TTL:** Stats cached for 60 seconds; history pages cached for 30 seconds

---

## Security

- All API routes protected by `x-api-key` header authentication
- CORS restricted to known frontend origins in production
- No private keys exposed to the frontend; all signing happens server-side
- Walrus blob IDs are content-addressed — any data modification produces a detectably different ID
- Sui anchor transactions are immutable once confirmed; no admin key can alter them
- MemWal data stored on Walrus under the operator's key; not accessible to third parties

---

## License

MIT
