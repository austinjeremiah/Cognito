# Cognito

> **Verifiable AI Agent Audit Trail** — cryptographic accountability for every autonomous decision, built on Walrus, Sui, and MemWal.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/)
[![Sui Network](https://img.shields.io/badge/Sui-Testnet%2FMainnet-6FBCF0)](https://sui.io/)
[![Walrus](https://img.shields.io/badge/Walrus-Testnet-orange)](https://walrus.site/)
[![Built with Mastra](https://img.shields.io/badge/Agent%20Framework-Mastra-blueviolet)](https://mastra.ai/)

---

## Table of Contents

- [The Problem](#the-problem)
- [What Cognito Does](#what-cognito-does)
- [Architecture Overview](#architecture-overview)
- [Trust Model](#trust-model)
- [Data Flow](#data-flow)
- [API Reference](#api-reference)
- [Frontend Pages](#frontend-pages)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [Monitoring & Operations](#monitoring--operations)
- [Security Model](#security-model)
- [Integrating Your Agent](#integrating-your-agent)
- [Contributing](#contributing)
- [License](#license)

---

## The Problem

Autonomous AI agents are increasingly executing consequential actions — executing trades, auditing smart contracts, deploying infrastructure, authorizing payments. Despite this, there is **no standard mechanism to prove what an agent did, when it did it, or why it made a given decision.**

Existing logging approaches are insufficient:

| Approach | Failure Mode |
|---|---|
| Centralized server logs | Single point of censorship or tampering; operator can rewrite history |
| In-memory agent traces | Ephemeral; lost on crash or restart |
| On-chain transaction records | Captures only final outputs, not intermediate reasoning or tool calls |
| Manual audit reports | Retroactive, incomplete, and not cryptographically verifiable |

Cognito closes this gap. Every action an agent takes is logged in real time, batched and stored as content-addressed blobs on Walrus, indexed via SuiSQL, anchored permanently to Sui, and made semantically searchable through MemWal's vector memory layer. **Every claim in Cognito's audit trail is independently verifiable by anyone, with no trusted third party.**

---

## What Cognito Does

Cognito is an **accountability infrastructure layer** for AI agents. It wraps around any Mastra-based agent (or any system that can call a REST API) and provides:

- **Tamper-proof action logging** — every tool call, API request, decision, and reasoning step is captured as a structured JSON record the moment it happens
- **Decentralized blob storage** — action batches are written to Walrus as content-addressed blobs; the blob ID is the cryptographic fingerprint; any modification produces a different ID
- **Structured SQL querying** — full action history queryable via SuiSQL, a Walrus-persisted on-chain database, without requiring an external database server
- **Permanent on-chain anchoring** — one immutable `SessionAnchored` Sui event per session permanently ties the Walrus blob ID to the blockchain; no admin key can alter it
- **Semantic memory recall** — MemWal embeds every action and stores it on Walrus; agents query past context via vector similarity before executing new actions, enabling contextually aware and auditable decision-making
- **Visual knowledge graph** — agent sessions rendered as a force-directed directed acyclic graph (DAG); nodes are individual actions, edges are causal dependency links
- **Cognito AI** — click any graph node and an AI assistant reads the actual Walrus blob content and MemWal memories to explain exactly what the agent did and why
- **One-click integrity verification** — per-action proof flow: fetch blob → check content hash → look up on-chain event → confirm match; anyone can run this independently

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Agent Runtime (Mastra)                      │
│         logAction tool  ·  session/start  ·  session/end        │
└────────────────────────────┬────────────────────────────────────┘
                             │ POST /api/log
                             │ POST /api/session/*
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cognito Backend  (Fastify / Node.js / TS)          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   SuiSQL     │  │    Walrus    │  │    Sui Mainnet       │  │
│  │  structured  │  │  blob store  │  │  SessionAnchored     │  │
│  │  action index│  │  (content-   │  │  event per session   │  │
│  │  (Walrus-    │  │  addressed)  │  │  via Tatum RPC       │  │
│  │  persisted)  │  │             │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐ │
│  │    MemWal    │  │               Redis                      │ │
│  │  vector      │  │  caching (stats 60s, history 30s)        │ │
│  │  memory on   │  │  background job queue (Walrus batch 30s) │ │
│  │  Walrus      │  │                                          │ │
│  └──────────────┘  └──────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                Cognito Frontend  (Next.js 15)                   │
│                                                                 │
│   Dashboard   ·   Agents   ·   Graph   ·   Sessions   ·  Verify│
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Role |
|---|---|
| **Fastify Backend** | API gateway, session lifecycle management, auth, rate limiting, job scheduling |
| **SuiSQL** | Structured on-chain SQL store for agent action index; persisted on Walrus, Sui-native queries |
| **Walrus** | Decentralized content-addressed blob storage for action batches; blob ID = cryptographic fingerprint |
| **Sui** | Immutable event anchor (`SessionAnchored`) per session; final tamper-proof record |
| **MemWal** | Semantic vector memory layer on Walrus; stores and retrieves agent context by similarity |
| **Redis** | Response caching, background Walrus write queue (30-second batch flush) |
| **Next.js Frontend** | Real-time dashboard, force-graph visualization, Cognito AI, integrity verification UI |

---

## Trust Model

Cognito operates across three independent verification layers. Compromising one does not compromise the others.

### Layer 1 — Content-Addressed Blob Integrity (Walrus)

Walrus stores data as content-addressed blobs. The blob ID is derived from the content itself via a cryptographic hash function. This means:

- If any byte of a stored action batch is modified, the blob ID changes
- A client can fetch a blob by ID and independently verify its content matches what was originally written
- No Walrus operator can silently modify a blob without the ID changing
- Cognito stores the blob ID in SuiSQL and anchors it on-chain; these references cannot be secretly updated

**Tamper detection is mathematically guaranteed, not policy-dependent.**

### Layer 2 — Semantic Recall Integrity (MemWal)

MemWal stores every action as an embedding on Walrus under the operator's private key. This provides:

- Semantically accurate context recall: agents retrieve the most relevant past actions by vector similarity before executing new steps
- An independent memory store separate from SuiSQL; cross-referencing both provides stronger evidence of completeness
- Storage on Walrus means memory blobs are also content-addressed and not secretly mutable

### Layer 3 — On-Chain Finality (Sui)

At session end, one Sui transaction fires a `SessionAnchored` event that permanently records:

- The session ID
- The Walrus blob ID for that session's action batch
- The SuiSQL record reference
- Timestamp and agent ID

Sui transactions are irreversible. No admin key — including Cognito's own — can alter or remove an anchored event. **This is the final, publicly auditable proof of what any session's blob ID was at the time of anchoring.**

---

## Data Flow

### Per-Action Path

```
1. Agent calls logAction(tool, input, output, reasoning)
         │
         ▼
2. POST /api/log  →  action written to SuiSQL with actionId, timestamp, agentId, sessionId
         │
         ├──► Action added to Redis batch queue
         │
         └──► MemWal.store(actionText, embedding)  ← fire-and-forget; non-blocking
                    │
                    └──► Stored as Walrus blob under operator key
```

### Batch Write Path (every 30 seconds)

```
Redis queue  →  flush N actions  →  JSON batch serialized
                                         │
                                         ▼
                               Walrus publisher  →  blob ID returned
                                         │
                                         ▼
                               SuiSQL record updated with blobId
```

### Session End Path

```
POST /api/session/end
         │
         ▼
Force-flush any queued actions  →  final Walrus blob written
         │
         ▼
Sui transaction (Tatum RPC)  →  SessionAnchored event emitted
         │                      { sessionId, blobId, agentId, timestamp }
         ▼
SuiSQL session record updated with txDigest + blobId
```

### Verification Path

```
GET /api/verify/:actionId
         │
         ▼
1. Fetch action from SuiSQL  →  get blobId
         │
         ▼
2. Fetch blob from Walrus aggregator  →  get raw content
         │
         ▼
3. Hash fetched content  →  compare to blobId  →  content match check
         │
         ▼
4. Query Sui  →  find SessionAnchored event for this session  →  confirm blobId matches
         │
         ▼
5. Return proof object  { contentMatch: bool, onChainMatch: bool, txDigest, walrusUrl }
```

---

## API Reference

All endpoints except `GET /health` require the `x-api-key` header matching `COGNITO_API_KEY`.

Base URL: `https://<your-backend>/`

---

### Health

#### `GET /health`

Returns backend liveness status, SuiSQL connection state, and Redis connectivity.

**Response**
```json
{
  "status": "ok",
  "suisql": "connected",
  "redis": "connected",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

### Sessions

#### `POST /api/session/start`

Initializes a new audit session for an agent. Must be called before logging any actions.

**Headers**
```
x-api-key: <COGNITO_API_KEY>
Content-Type: application/json
```

**Body**
```json
{
  "agentId": "trading-agent-v2",
  "metadata": {
    "model": "llama-3.3-70b-versatile",
    "environment": "production",
    "task": "rebalance portfolio"
  }
}
```

**Response**
```json
{
  "sessionId": "sess_01J9XK...",
  "agentId": "trading-agent-v2",
  "startedAt": "2025-01-01T00:00:00.000Z"
}
```

---

#### `POST /api/session/end`

Closes a session. Triggers force-flush of queued actions to Walrus and fires the Sui anchor transaction.

**Body**
```json
{
  "sessionId": "sess_01J9XK..."
}
```

**Response**
```json
{
  "sessionId": "sess_01J9XK...",
  "blobId": "0x4a3f...",
  "txDigest": "FZmN...",
  "anchoredAt": "2025-01-01T00:01:30.000Z",
  "actionCount": 14
}
```

---

### Actions

#### `POST /api/log`

Logs a single agent action. The primary ingestion endpoint — call this from your Mastra tool or agent code.

**Body**
```json
{
  "sessionId": "sess_01J9XK...",
  "agentId": "trading-agent-v2",
  "tool": "executeTrade",
  "input": {
    "pair": "SOL/USDC",
    "side": "buy",
    "amount": 100
  },
  "output": {
    "txId": "5xnQ...",
    "executedPrice": 183.42,
    "slippage": 0.002
  },
  "reasoning": "RSI crossed below 30 on 4H timeframe; mean-reversion signal confirmed by volume spike",
  "timestamp": "2025-01-01T00:00:12.000Z"
}
```

**Response**
```json
{
  "actionId": "act_01J9XKR...",
  "queued": true,
  "sessionId": "sess_01J9XK..."
}
```

---

#### `GET /api/history/:agentId`

Returns paginated action history for an agent, ordered by timestamp descending.

**Query Parameters**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Records per page (max 100) |
| `sessionId` | string | — | Filter to specific session |
| `tool` | string | — | Filter to specific tool name |
| `from` | ISO timestamp | — | Filter actions after this time |
| `to` | ISO timestamp | — | Filter actions before this time |

**Response**
```json
{
  "agentId": "trading-agent-v2",
  "total": 847,
  "page": 1,
  "limit": 20,
  "actions": [
    {
      "actionId": "act_01J9XKR...",
      "sessionId": "sess_01J9XK...",
      "tool": "executeTrade",
      "input": { "...": "..." },
      "output": { "...": "..." },
      "reasoning": "...",
      "blobId": "0x4a3f...",
      "timestamp": "2025-01-01T00:00:12.000Z"
    }
  ]
}
```

---

### Verification

#### `GET /api/verify/:actionId`

Runs the full three-layer integrity proof for a specific action.

**Response**
```json
{
  "actionId": "act_01J9XKR...",
  "proof": {
    "contentMatch": true,
    "onChainMatch": true,
    "blobId": "0x4a3f...",
    "walrusBlobUrl": "https://aggregator.walrus-testnet.walrus.space/v1/blobs/0x4a3f...",
    "suiTxDigest": "FZmN...",
    "suiExplorerUrl": "https://testnet.suivision.xyz/txblock/FZmN...",
    "verifiedAt": "2025-01-01T00:05:00.000Z"
  },
  "status": "VERIFIED"
}
```

Possible `status` values: `VERIFIED` · `CONTENT_MISMATCH` · `ON_CHAIN_MISMATCH` · `BLOB_NOT_FOUND` · `NOT_YET_ANCHORED`

---

### Graph

#### `GET /api/graph/:agentId`

Returns the full causal action graph for an agent as nodes and directed edges.

**Query Parameters**

| Param | Type | Default | Description |
|---|---|---|---|
| `sessionId` | string | — | Scope to a single session |
| `depth` | number | — | Maximum edge depth from root nodes |

**Response**
```json
{
  "agentId": "trading-agent-v2",
  "nodes": [
    {
      "id": "act_01J9XKR...",
      "tool": "executeTrade",
      "timestamp": "2025-01-01T00:00:12.000Z",
      "blobId": "0x4a3f...",
      "sessionId": "sess_01J9XK..."
    }
  ],
  "edges": [
    {
      "source": "act_01J9XKA...",
      "target": "act_01J9XKR...",
      "type": "CAUSED_BY"
    }
  ]
}
```

---

### AI Explanation

#### `POST /api/explain`

Queries the Cognito AI assistant with the actual Walrus blob content and MemWal context injected. Returns an explanation of what the agent did and why.

**Body**
```json
{
  "actionId": "act_01J9XKR...",
  "question": "Why did the agent execute this trade at this price instead of waiting?"
}
```

**Response**
```json
{
  "actionId": "act_01J9XKR...",
  "explanation": "Based on the blob content at 0x4a3f... and 3 relevant past actions retrieved from MemWal: the agent observed an RSI of 28.4 on the 4H chart and a volume anomaly of +340% relative to the 7-day average. Prior context from 6 hours earlier shows the agent had already identified this as a high-conviction setup. The decision to not wait was justified by the agent's reasoning trace which flagged time-sensitivity: the window for the mean-reversion entry was assessed as closing within 2 candles.",
  "blobId": "0x4a3f...",
  "memwalContextCount": 3,
  "model": "llama-3.1-8b-instant"
}
```

---

### Stats

#### `GET /api/stats`

Live counts across the entire platform.

**Response**
```json
{
  "agents": 12,
  "sessions": {
    "total": 347,
    "active": 3,
    "anchored": 341
  },
  "actions": {
    "total": 18492,
    "last24h": 1203,
    "pendingBlob": 14
  },
  "walrusBlobs": 341,
  "suiAnchors": 341,
  "cachedUntil": "2025-01-01T00:01:00.000Z"
}
```

---

## Frontend Pages

### Dashboard (`/`)

Real-time platform overview. Displays:
- Live stats panel: total agents, sessions, actions, Sui anchors
- Activity feed: last 50 logged actions across all agents (auto-refreshes every 10 seconds)
- Recent sessions: status, action count, blob ID, anchor tx link

### Agents (`/agents`)

Agent registry and per-agent view. Each agent card shows:
- Agent ID, registration timestamp, session count, total actions
- Last active timestamp
- Link to session history and memory explorer

Per-agent deep-dive (`/agents/:agentId`):
- Full paginated action timeline with tool, input/output, reasoning, and blob link
- Filter by session, tool name, and time range
- MemWal memory explorer: semantic search over all stored memories

### Graph (`/graph/:agentId`)

Force-directed DAG rendered with `react-force-graph-2d`. Features:
- Nodes colored by tool type; size scaled by output complexity
- Edge directionality shows causal dependency
- Click a node to open the Cognito AI panel: ask natural language questions about that action; AI reads the actual blob content and MemWal context to answer
- Session scoping: view full agent history or isolate a single session
- Export graph as JSON

### Sessions (`/sessions/:sessionId`)

Session detail view. Shows:
- Session metadata: agent ID, start/end time, action count, status
- Walrus blob ID with direct aggregator link
- Sui anchor tx digest with SuiVision explorer link
- Full action list for this session
- One-click integrity verification: runs the full three-layer proof inline

---

## Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Agent framework | [Mastra](https://mastra.ai/) | Latest; logAction as registered tool |
| Backend runtime | Node.js | 20+ required |
| Backend framework | [Fastify](https://fastify.dev/) | TypeScript; async-first |
| Frontend | [Next.js](https://nextjs.org/) | 15, App Router |
| Decentralized storage | [Walrus](https://walrus.site/) | Testnet; publisher + aggregator |
| On-chain database | [SuiSQL](https://docs.sui.io/) | Walrus-persisted, Sui-native SQL |
| Blockchain | [Sui](https://sui.io/) | Testnet anchor; mainnet-compatible |
| RPC gateway | [Tatum](https://tatum.io/) | Sui mainnet + testnet RPC |
| Semantic memory | [MemWal](https://memwal.ai/) | `@mysten-incubation/memwal` |
| AI inference | [Groq](https://groq.com/) | `llama-3.1-8b-instant` |
| Cache / queue | Redis | `ioredis`; stats TTL 60s, batch queue |
| Graph rendering | [react-force-graph-2d](https://github.com/vasturiano/react-force-graph) | Force-directed DAG |
| UI components | [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS | |

---

## Environment Variables

### Backend (`cognito-backend/.env`)

```env
# ─────────────────────────────────────────────
# Server
# ─────────────────────────────────────────────
NODE_ENV=production
PORT=3001

# ─────────────────────────────────────────────
# Auth
# Generate: openssl rand -hex 32
# ─────────────────────────────────────────────
COGNITO_API_KEY=

# ─────────────────────────────────────────────
# Tatum RPC (Sui mainnet + testnet)
# Get at: https://tatum.io/
# ─────────────────────────────────────────────
TATUM_API_KEY=
TATUM_SUI_RPC_URL=https://sui-mainnet.gateway.tatum.io
TATUM_SUI_TESTNET_RPC_URL=https://sui-testnet.gateway.tatum.io

# ─────────────────────────────────────────────
# Sui wallet (used for session anchor txs)
# SUI_PRIVATE_KEY: bech32 keypair export from `sui keytool export`
# ─────────────────────────────────────────────
SUI_PRIVATE_KEY=
SUI_ADDRESS=

# ─────────────────────────────────────────────
# Walrus
# Publisher: where blobs are written TO
# Aggregator: where blobs are read FROM
# ─────────────────────────────────────────────
WALRUS_PUBLISHER_URL=https://publisher.walrus-01.tududes.com
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

# ─────────────────────────────────────────────
# SuiSQL
# SUISQL_OBJECT_ID: the on-chain object ID of your SuiSQL instance
# Create via SuiSQL CLI before first run
# ─────────────────────────────────────────────
SUISQL_NETWORK=testnet
SUISQL_OBJECT_ID=

# ─────────────────────────────────────────────
# MemWal
# Get account at: https://memwal.ai/
# ─────────────────────────────────────────────
MEMWAL_PRIVATE_KEY=
MEMWAL_ACCOUNT_ID=
MEMWAL_SERVER_URL=https://relayer.memwal.ai

# ─────────────────────────────────────────────
# Redis
# Local: redis://localhost:6379
# Render/Railway: provided as REDIS_URL env var
# ─────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─────────────────────────────────────────────
# Groq (Cognito AI inference)
# Get at: https://console.groq.com/
# ─────────────────────────────────────────────
GROQ_API_KEY=
```

### Frontend (`frontend/.env.local`)

```env
# URL of your running Cognito backend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Must match COGNITO_API_KEY in backend .env
NEXT_PUBLIC_COGNITO_KEY=

# Walrus aggregator for direct blob links in the UI
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space

# Sui block explorer base URL
NEXT_PUBLIC_SUIVISION_BASE=https://testnet.suivision.xyz
```

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 8+ (`npm install -g pnpm`)
- Redis running locally (`redis-server` or Docker)
- All environment variables configured

### Setup

**1. Clone the repo**

```bash
git clone https://github.com/your-org/cognito.git
cd cognito
```

**2. Start Redis**

```bash
# Docker (recommended)
docker run -d -p 6379:6379 redis:alpine

# Or native
redis-server
```

**3. Set up SuiSQL**

Before running the backend for the first time, you need to create your SuiSQL instance on Sui testnet and record the object ID.

```bash
# Install SuiSQL CLI (see SuiSQL docs)
suisql create --network testnet
# Copy the returned object ID to SUISQL_OBJECT_ID in your backend .env
```

**4. Install and run the backend**

```bash
cd cognito-backend
cp .env.example .env
# Fill in all values in .env
npm install
npm run dev
# Backend runs on http://localhost:3001
# GET http://localhost:3001/health should return { "status": "ok" }
```

**5. Install and run the frontend**

```bash
cd frontend
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_API_URL=http://localhost:3001 and NEXT_PUBLIC_COGNITO_KEY
pnpm install
pnpm dev
# Frontend runs on http://localhost:3000
```

### Testing the Stack

Register a session and log a test action to confirm everything is wired:

```bash
# Start a session
curl -X POST http://localhost:3001/api/session/start \
  -H "x-api-key: YOUR_COGNITO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent", "metadata": {"env": "local"}}'

# Log an action (replace SESSION_ID)
curl -X POST http://localhost:3001/api/log \
  -H "x-api-key: YOUR_COGNITO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "agentId": "test-agent",
    "tool": "testTool",
    "input": {"ping": true},
    "output": {"pong": true},
    "reasoning": "Testing Cognito end-to-end"
  }'

# End the session (triggers Walrus write + Sui anchor)
curl -X POST http://localhost:3001/api/session/end \
  -H "x-api-key: YOUR_COGNITO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "SESSION_ID"}'
```

The response from `session/end` will contain the `blobId` and `txDigest`. Verify the blob in the UI or via `GET /api/verify/:actionId`.

---

## Deployment

### Backend (Render or Railway)

Cognito's backend is a standard Node.js server. Any platform that supports Node.js 20 and Redis add-ons works.

**Render (recommended)**

1. Create a new **Web Service**, connect your repo, point to `cognito-backend/`
2. Add a Redis instance via the Render dashboard (or use Upstash)
3. Set environment variables in the Render UI (all from `.env` above)
4. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`

**Railway**

1. `railway init` inside `cognito-backend/`
2. `railway add --plugin redis`
3. Set all env vars via `railway variables set KEY=VALUE`
4. Deploy: `railway up`

---

### Frontend (Vercel)

1. Import the `frontend/` directory into Vercel
2. Set environment variables in the Vercel project settings:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   NEXT_PUBLIC_COGNITO_KEY=your-api-key
   NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
   NEXT_PUBLIC_SUIVISION_BASE=https://testnet.suivision.xyz
   ```
3. Deploy. Vercel handles the Next.js 15 App Router build automatically.

> **Important:** After deploying the backend, redeploy the frontend so `NEXT_PUBLIC_API_URL` resolves to the live backend URL.

---

## Monitoring & Operations

### Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness probe; SuiSQL + Redis status |
| `GET /api/stats` | Live counts; cached 60s |

### Logging

Cognito uses [Winston](https://github.com/winstonjs/winston) for structured JSON logs across all routes and background services. Log level is controlled by `NODE_ENV`:
- `production`: `info` and above
- `development`: `debug` and above

All logs include `timestamp`, `level`, `service` (route or job name), and a structured `meta` object.

### Background Jobs

| Job | Schedule | Description |
|---|---|---|
| Walrus batch writer | Every 30 seconds | Flushes queued actions from Redis to Walrus as blobs; updates SuiSQL with blob IDs |
| Stats cache refresh | On request (TTL 60s) | Aggregates live platform stats; served from Redis cache until TTL expires |

### Rate Limiting

100 requests per minute per IP via `@fastify/rate-limit`. Exceeding returns `429 Too Many Requests` with a `Retry-After` header.

### Common Operations

**Manually force-flush the blob queue** (e.g., before a demo or planned downtime):
```bash
curl -X POST http://localhost:3001/api/admin/flush \
  -H "x-api-key: YOUR_COGNITO_API_KEY"
```

**Check pending blob queue depth:**
```bash
curl http://localhost:3001/api/stats \
  -H "x-api-key: YOUR_COGNITO_API_KEY" \
  | jq '.actions.pendingBlob'
```

---

## Security Model

| Concern | Mitigation |
|---|---|
| API authentication | All routes require `x-api-key` header; 32-byte hex secret |
| CORS | Restricted to known frontend origins in production |
| Private key exposure | All Sui signing happens server-side; no private keys reach the frontend |
| Blob tampering | Walrus blob IDs are content-addressed; any modification produces a different ID, detectable by the verification flow |
| Anchor tampering | Sui events are irreversible; no admin key can delete or modify `SessionAnchored` events |
| MemWal access | Stored on Walrus under the operator's private key; not readable by third parties |
| Rate limiting | 100 req/min per IP; prevents ingestion flooding |
| Injection | All SuiSQL inputs parameterized; no raw string interpolation in queries |

---

## Integrating Your Agent

### Mastra Integration

Add `logAction` as a registered Mastra tool. Cognito ships a reference tool you can drop directly into your agent:

```typescript
// tools/cognito.ts
import { createTool } from "@mastra/core";
import { z } from "zod";

const COGNITO_URL = process.env.COGNITO_API_URL!;
const COGNITO_KEY = process.env.COGNITO_API_KEY!;

export const logAction = createTool({
  id: "logAction",
  description: "Log this agent action to the Cognito audit trail",
  inputSchema: z.object({
    sessionId: z.string(),
    tool: z.string(),
    input: z.record(z.unknown()),
    output: z.record(z.unknown()),
    reasoning: z.string(),
  }),
  execute: async ({ context }) => {
    const res = await fetch(`${COGNITO_URL}/api/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": COGNITO_KEY,
      },
      body: JSON.stringify({
        agentId: process.env.AGENT_ID,
        ...context,
        timestamp: new Date().toISOString(),
      }),
    });
    return res.json();
  },
});
```

Register it in your agent:

```typescript
import { Agent } from "@mastra/core";
import { logAction } from "./tools/cognito";

export const myAgent = new Agent({
  name: "my-agent",
  tools: { logAction, /* your other tools */ },
  instructions: `
    After every tool call, call logAction with:
    - The name of the tool you called
    - The exact input you provided
    - The exact output you received
    - Your reasoning for calling that tool at that moment
  `,
});
```

### Session Lifecycle

Your orchestrator (workflow, cron job, or API handler) is responsible for starting and ending sessions:

```typescript
// Start a session before running the agent
const { sessionId } = await fetch(`${COGNITO_URL}/api/session/start`, {
  method: "POST",
  headers: { "x-api-key": COGNITO_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ agentId: "my-agent", metadata: { task: "..." } }),
}).then(r => r.json());

// Pass sessionId to your agent via context or env
process.env.CURRENT_SESSION_ID = sessionId;

// Run agent
await myAgent.generate("...");

// End session after agent finishes — triggers Walrus write + Sui anchor
await fetch(`${COGNITO_URL}/api/session/end`, {
  method: "POST",
  headers: { "x-api-key": COGNITO_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ sessionId }),
});
```

### Direct API Integration (non-Mastra)

Any system that can make HTTP requests can use Cognito. The `POST /api/log` endpoint accepts any agent framework. Pass the tool name, input, output, and reasoning as JSON — the schema is intentionally flexible.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with conventional commits: `git commit -m "feat: add X"`
4. Push and open a pull request against `main`

Please open an issue before starting large changes to avoid duplicate work.

---

## License

MIT — see [LICENSE](LICENSE) for full terms.

---

<p align="center">Built for the Tatum hack 2026 Hackathon &nbsp;·&nbsp; DeFi & Payments + Tooling tracks</p>