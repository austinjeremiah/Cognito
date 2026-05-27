# Cognito — Full Build Blueprint
### Hackathon Edition · Solo Build · May 2026

> **Strategy:** Testnet for heavy data. Mainnet for one visible proof anchor. Verification is one click. The UI itself runs on Walrus Sites.
> **Stack:** Mastra + SuiSQL + Walrus + **Walrus Sites** + Tatum RPC + Sui Mainnet + Next.js

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [Environment Variables](#4-environment-variables)
5. [Backend Documentation](#5-backend-documentation)
   - 5.1 Folder Structure
   - 5.2 API Integrations
   - 5.3 Core Servicesx
   - 5.4 Database Schema
   - 5.5 Data Flow
   - 5.6 Background Jobs
   - 5.7 Caching Strategy
   - 5.8 Error Handling
   - 5.9 Security
   - 5.10 Logging & Monitoring
   - 5.11 Deployment
6. [Frontend Documentation](#6-frontend-documentation)
   - 6.1 Folder Structure
   - 6.2 Pages & Screens
   - 6.3 Component Library
   - 6.4 State Management
   - 6.5 Routing
   - 6.6 API Integration Per Page
7. [Integration Build Sequence](#7-integration-build-sequence)
8. [Judging Impact Map](#8-judging-impact-map)

---

## 1. Project Overview

**Cognito is the verifiable, uncensorable memory layer for AI agents.** Not just an audit log — a cryptographically provable record where every claim can be checked by anyone, and no single party can take it down.

Every action an agent takes is:

1. Logged as a structured JSON entry
2. Stored permanently on **Walrus** (decentralized, content-addressed blob storage — the blob ID *is* the hash of the bytes, so any tampering is mathematically detectable)
3. Indexed in **SuiSQL** (SQL DB persisted on-chain via Walrus + Sui)
4. Anchored to **Sui Mainnet** at session end (one summary tx per session, immutable forever)
5. Queryable by the agent itself via **Mastra tools** (MCP-compatible) — true agentic memory
6. Visualized as a **knowledge graph** in the UI
7. **Verifiable on demand** — one click re-fetches the blob, recomputes its hash, and checks it against the on-chain anchor event (see §5.3 VerifyService + §6.2 Page 4)
8. **Served from Walrus Sites** — the dashboard itself runs decentralized. No Vercel, no AWS, no DNS chokepoint (see §5.2.F + §7 Day 10)

### The two structural promises

| Promise | How it's enforced (not just claimed) |
|---|---|
| **Verifiable** | Walrus content-addressing means the blob ID equals the cryptographic hash of its bytes. The Sui mainnet anchor event records that exact blob ID. Anyone can re-fetch the blob from any aggregator, re-hash it, and confirm it matches — without trusting Cognito's backend. |
| **Uncensorable** | Storage on Walrus (erasure-coded across nodes), index on SuiSQL (persisted to Walrus + Sui), proofs on Sui mainnet, and the **UI itself on Walrus Sites**. Every layer of the stack survives any single party going offline. Tatum is used as a reliable RPC gateway but is fully swappable — anyone can verify with any Sui RPC. |

**Why it matters for judges:**
- Any AI agent using Cognito becomes *cryptographically auditable* — not "trust us, we logged it" but "verify it yourself in one click"
- Combines Walrus storage + **Walrus Sites** + SuiSQL indexing + Sui mainnet anchoring + Tatum RPC in one coherent product
- The agent can read AND verify its own history — agentic memory with provable provenance

---

## 2. Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                        AGENT (Mastra)                       │
│  - Takes actions                                            │
│  - Calls log_action tool → Cognito backend              │
│  - Calls query_history tool → reads own past from SuiSQL    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / MCP tools
┌──────────────────────────▼──────────────────────────────────┐
│                   COGNITO BACKEND (Node.js)             │
│                                                             │
│  POST /api/log         → ActionLogService                   │
│  POST /api/session/end → SessionAnchorService               │
│  GET  /api/history     → SuiSQLQueryService                 │
│  GET  /api/blob/:id    → WalrusReadService                  │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ActionQueue  │  │WalrusBatcher │  │ SuiSQL Indexer    │  │
│  │(in-memory)  │→ │(every 30s)   │→ │(testnet)          │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
│                          │                                  │
│              ┌───────────▼──────────────┐                  │
│              │  Sui Mainnet Anchor TX   │ ← session end    │
│              │  via Tatum RPC           │                  │
│              └──────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    STORAGE LAYER                            │
│                                                             │
│  Walrus Testnet  → blob storage for action batches          │
│  SuiSQL Testnet  → SQL index: agents, sessions, actions     │
│  Sui Testnet     → SuiSQL DB pointer objects                │
│  Sui Mainnet     → one summary anchor tx per session        │
└─────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│           FRONTEND (Next.js → published to Walrus Sites)    │
│                                                             │
│  Dashboard → Agent List → Session View → Knowledge Graph    │
│  Every tx links to SuiVision. Every blob links to Walrus.   │
│                                                             │
│  ▶ "Verify Integrity" button on Session Detail:             │
│    fetch blob → recompute SHA-256 → compare to blob ID      │
│    → compare to SessionAnchored event on Sui → ✅ / ❌      │
│                                                             │
│  ▶ Site served at https://<site-id>.walrus.site             │
│    No centralized host. Pointer object lives on Sui.        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack & Dependencies

### Backend
| Package | Version | Purpose |
|---|---|---|
| `@mastra/core` | latest | Agent framework, tool creation |
| `@mysten/sui` | latest | Sui SDK (gRPC client) |
| `@mysten/walrus` | latest | Walrus blob read/write |
| `@fizzyflow/suisql` | `0.0.28` | SQL DB on Walrus + Sui |
| `@tatumio/blockchain-mcp` | latest | Tatum MCP server (RPC gateway) |
| `fastify` | `4.x` | HTTP server |
| `zod` | `3.x` | Schema validation |
| `ioredis` | `5.x` | Redis caching |
| `node-cron` | `3.x` | Scheduled Walrus batch writes |
| `winston` | `3.x` | Structured logging |
| `dotenv` | `16.x` | Env config |
| `typescript` | `5.x` | Type safety |
| `tsx` | latest | TS execution |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| `next` | `14.x` | App framework (App Router) |
| `react` | `18.x` | UI |
| `tailwindcss` | `3.x` | Styling |
| `shadcn/ui` | latest | Component library |
| `react-force-graph` | latest | Knowledge graph visualization |
| `@tanstack/react-query` | `5.x` | Server state / caching |
| `zustand` | `4.x` | Client state |
| `lucide-react` | latest | Icons |
| `date-fns` | `3.x` | Date formatting |
| `recharts` | `2.x` | Charts on dashboard |

---

## 4. Environment Variables

Create `.env` in the backend root. Every variable listed here is required.

```env
# ─── TATUM ───────────────────────────────────────────────────
TATUM_API_KEY=your_tatum_api_key_here
TATUM_SUI_RPC_URL=https://sui-mainnet.gateway.tatum.io
TATUM_SUI_TESTNET_RPC_URL=https://sui-testnet.gateway.tatum.io

# ─── SUI KEYPAIR (backend signer) ────────────────────────────
# Ed25519 private key for signing txs (base64 encoded)
SUI_PRIVATE_KEY=your_ed25519_private_key_base64
SUI_MAINNET_ADDRESS=0xYOUR_MAINNET_ADDRESS
SUI_TESTNET_ADDRESS=0xYOUR_TESTNET_ADDRESS

# ─── WALRUS ──────────────────────────────────────────────────
# Testnet (default for all heavy storage)
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
# Mainnet aggregator (for reading mainnet anchor blobs if any)
WALRUS_MAINNET_AGGREGATOR_URL=https://aggregator.walrus-mainnet.walrus.space

# ─── SUISQL ──────────────────────────────────────────────────
SUISQL_NETWORK=testnet
# SuiSQL persists its own DB file to Walrus; we store the pointer object ID here after first init
SUISQL_DB_OBJECT_ID=         # fill after first run

# ─── COGNITO MOVE CONTRACT (Mainnet anchor) ──────────────
# Deployed Cognito Move module on Sui mainnet
COGNITO_PACKAGE_ID=0xYOUR_PACKAGE_ID
COGNITO_MODULE=agent_ledger

# ─── REDIS ───────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── APP ─────────────────────────────────────────────────────
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# ─── FRONTEND (Next.js .env.local) ───────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUIVISION_BASE=https://suivision.xyz
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
# Public Sui RPC used by the browser for trustless verification
# (intentionally NOT routed through Tatum so verification needs no API key)
NEXT_PUBLIC_SUI_PUBLIC_RPC=https://fullnode.mainnet.sui.io:443

# ─── WALRUS SITES (decentralized frontend hosting) ───────────
# Filled after first publish with the site-builder CLI
WALRUS_SITE_OBJECT_ID=
NEXT_PUBLIC_WALRUS_SITE_URL=
```

**Where to get each:**
- `TATUM_API_KEY` → [dashboard.tatum.io](https://dashboard.tatum.io) → Create API Key → copy
- `SUI_PRIVATE_KEY` → `sui keytool generate ed25519` → export from `~/.sui/sui_config/sui.keystore`
- `WALRUS_*` → Hardcoded public URLs, no key needed for testnet
- `COGNITO_PACKAGE_ID` → After you deploy the Move contract (Day 3, see §7)
- `REDIS_URL` → Local Redis for dev; Railway/Upstash for deploy

---

## 5. Backend Documentation

### 5.1 Folder Structure

```
cognito-backend/
├── src/
│   ├── index.ts                    # Fastify server entry point
│   ├── config.ts                   # Env + constants (validated with zod)
│   │
│   ├── routes/
│   │   ├── log.ts                  # POST /api/log — receive action log entry
│   │   ├── session.ts              # POST /api/session/start, /api/session/end
│   │   ├── history.ts              # GET  /api/history/:agentId
│   │   ├── blob.ts                 # GET  /api/blob/:blobId — proxy Walrus read
│   │   ├── verify.ts               # GET  /api/verify/:actionId — content-hash proof
│   │   └── health.ts               # GET  /api/health
│   │
│   ├── services/
│   │   ├── ActionQueueService.ts   # In-memory queue, batches action logs
│   │   ├── WalrusService.ts        # writeBlob, readBlob, writeBatch, computeBlobId
│   │   ├── SuiSQLService.ts        # init DB, insertAction, queryHistory
│   │   ├── SuiAnchorService.ts     # sign + send mainnet anchor tx via Tatum RPC
│   │   ├── VerifyService.ts        # fetch blob → re-hash → match to on-chain event
│   │   ├── TatumRPCService.ts      # wrapper around Tatum gateway_execute_rpc
│   │   └── CacheService.ts         # Redis get/set/del helpers
│   │
│   ├── mastra/
│   │   ├── index.ts                # Mastra instance + agent definition
│   │   ├── tools/
│   │   │   ├── logActionTool.ts    # Tool: log_action → POST /api/log
│   │   │   ├── queryHistoryTool.ts # Tool: query_history → GET /api/history
│   │   │   ├── readBlobTool.ts     # Tool: read_blob → GET /api/blob/:id
│   │   │   ├── verifyActionTool.ts # Tool: verify_action — agent self-audits
│   │   │   └── endSessionTool.ts   # Tool: end_session → POST /api/session/end
│   │   └── agent.ts                # Example demo agent using the tools
│   │
│   ├── move/
│   │   └── agent_ledger.move       # Sui Move contract for mainnet anchor
│   │
│   ├── jobs/
│   │   └── walrusBatchJob.ts       # node-cron: flush queue → Walrus every 30s
│   │
│   ├── middleware/
│   │   ├── auth.ts                 # API key validation for inbound requests
│   │   └── errorHandler.ts         # Global Fastify error handler
│   │
│   ├── types/
│   │   ├── ActionLog.ts            # ActionLog, Session, Agent types
│   │   └── SuiTypes.ts             # Sui tx + object type shapes
│   │
│   └── utils/
│       ├── logger.ts               # Winston logger setup
│       └── retry.ts                # Exponential backoff retry helper
│
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

---

### 5.2 API Integrations

#### A. Tatum RPC (Sui Mainnet + Testnet)

**Purpose:** Production-grade RPC gateway for all Sui blockchain calls.

**Base URLs:**
- Mainnet: `https://sui-mainnet.gateway.tatum.io`
- Testnet: `https://sui-testnet.gateway.tatum.io`

**Authentication:** `x-api-key` header

**Rate limits:** Free tier = 3 RPS, 100,000 credits/month (2 credits/call)

**Implementation — `src/services/TatumRPCService.ts`:**
```typescript
import { SuiClient, SuiHTTPTransport } from '@mysten/sui/client';

export function createSuiClient(network: 'mainnet' | 'testnet'): SuiClient {
  const url =
    network === 'mainnet'
      ? process.env.TATUM_SUI_RPC_URL!
      : process.env.TATUM_SUI_TESTNET_RPC_URL!;

  const transport = new SuiHTTPTransport({
    url,
    rpc: {
      headers: { 'x-api-key': process.env.TATUM_API_KEY! },
    },
  });

  return new SuiClient({ transport });
}

// Use gRPC client for new code (JSON-RPC EOL July 31, 2026)
import { SuiGrpcClient } from '@mysten/sui/grpc';
export function createSuiGrpcClient(network: 'mainnet' | 'testnet') {
  return new SuiGrpcClient({
    network,
    // Tatum gRPC endpoint — use HTTP transport as fallback if gRPC not supported
  });
}
```

**Fallback URL if Tatum credits run out:**
```
https://fullnode.mainnet.sui.io:443   (mainnet)
https://fullnode.testnet.sui.io:443   (testnet)
```

---

#### B. Walrus (Testnet Storage)

**Purpose:** Permanent decentralized blob storage for action log batches.

**Publisher URL (testnet, free):** `https://publisher.walrus-testnet.walrus.space`
**Aggregator URL (testnet, free):** `https://aggregator.walrus-testnet.walrus.space`

**No authentication required for testnet.**

**Implementation — `src/services/WalrusService.ts`:**
```typescript
import { WalrusClient } from '@mysten/walrus';
import { SuiClient } from '@mysten/sui/client';

export class WalrusService {
  private client: WalrusClient;

  constructor(suiClient: SuiClient) {
    this.client = new WalrusClient({
      network: 'testnet',
      suiClient,
      // Override publisher/aggregator if needed:
      // publisherUrl: process.env.WALRUS_PUBLISHER_URL,
      // aggregatorUrl: process.env.WALRUS_AGGREGATOR_URL,
    });
  }

  async writeBlob(data: Uint8Array, epochs = 10): Promise<string> {
    // Returns blobId
    const result = await this.client.writeBlob({
      blob: data,
      deletable: false,
      epochs,
    });
    return result.blobId;
  }

  async readBlob(blobId: string): Promise<Uint8Array> {
    return this.client.readBlob({ blobId });
  }

  async writeBatch(entries: ActionLog[]): Promise<string> {
    const payload = JSON.stringify(entries);
    const bytes = new TextEncoder().encode(payload);
    return this.writeBlob(bytes);
  }
}
```

**Cost:** Free on testnet. Mainnet = $0.023/GB/month paid in WAL.

---

#### C. SuiSQL (Testnet Index)

**Package:** `@fizzyflow/suisql` v0.0.28 (Apache-2.0, actively maintained)
**Network:** testnet (mainnet support may work — validate on Day 1)

**Implementation — `src/services/SuiSQLService.ts`:**
```typescript
import SuiSQL from '@fizzyflow/suisql';
import { SuiMaster } from 'suidouble';

export class SuiSQLService {
  private db: any;
  private suiMaster: any;

  async init() {
    this.suiMaster = new SuiMaster({
      network: process.env.SUISQL_NETWORK as 'testnet' | 'mainnet',
      privateKey: process.env.SUI_PRIVATE_KEY!,
    });

    this.db = new SuiSQL({
      suiMaster: this.suiMaster,
      // If resuming: provide existing DB object ID
      objectId: process.env.SUISQL_DB_OBJECT_ID || undefined,
    });

    await this.db.init();

    // Create tables if not exists
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        total_sessions INTEGER DEFAULT 0
      )
    `);

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        action_count INTEGER DEFAULT 0,
        blob_id TEXT,
        mainnet_tx_digest TEXT
      )
    `);

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS actions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        ts INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        description TEXT,
        blob_id TEXT,
        parent_action_id TEXT,
        metadata TEXT
      )
    `);

    // Save DB object ID after first init
    if (!process.env.SUISQL_DB_OBJECT_ID) {
      const objectId = await this.db.getObjectId();
      console.log(`SuiSQL DB Object ID: ${objectId}`);
      console.log(`Add SUISQL_DB_OBJECT_ID=${objectId} to your .env`);
    }
  }

  async insertAction(action: ActionLog): Promise<void> {
    await this.db.query(
      `INSERT INTO actions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        action.id,
        action.sessionId,
        action.agentId,
        action.ts,
        action.actionType,
        action.description,
        action.blobId || null,
        action.parentActionId || null,
        JSON.stringify(action.metadata || {}),
      ]
    );
  }

  async queryHistory(agentId: string, limit = 50): Promise<ActionLog[]> {
    return this.db.query(
      `SELECT * FROM actions WHERE agent_id = ? ORDER BY ts DESC LIMIT ?`,
      [agentId, limit]
    );
  }

  async persist(): Promise<string> {
    // Flush SuiSQL state to Walrus — returns new blob ID
    return this.db.persist();
  }
}
```

---

#### D. Sui Move Contract (Mainnet Anchor)

**File: `src/move/agent_ledger.move`**

```move
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
```

**Deploy:**
```bash
sui client publish --gas-budget 100000000 src/move/
# Copy PackageID from output → COGNITO_PACKAGE_ID in .env
```

---

#### E. Tatum MCP Server (Agent Tool Access)

**Install globally:**
```bash
npm install -g @tatumio/blockchain-mcp
```

**MCP config for Mastra / Claude Desktop:**
```json
{
  "mcpServers": {
    "tatumio": {
      "command": "npx",
      "args": ["@tatumio/blockchain-mcp"],
      "env": { "TATUM_API_KEY": "YOUR_KEY" }
    }
  }
}
```

**Usage in agent:** Only `gateway_execute_rpc` is reliable for Sui. All other tools (portfolio, tx history) do NOT support Sui.

```typescript
// Example: agent queries a Sui object via Tatum MCP
const result = await tatumMcp.gateway_execute_rpc({
  chain: 'sui-mainnet',
  method: 'sui_getObject',
  params: [{ objectId: '0x...', options: { showContent: true } }],
});
```

---

#### F. Walrus Sites (Decentralized Frontend Hosting)

**Purpose:** Publish the entire Next.js dashboard *on Walrus itself* so the UI has no centralized host. Static build is stored as Walrus blobs; a Sui object points to the bundle; the Walrus aggregator network serves it under `*.walrus.site`.

**Why this is necessary, not cosmetic:** Without it, the pitch is "decentralized backend, centralized frontend on Vercel." With it, **every layer is uncensorable** — storage, index, proofs, and UI. There is no DNS, no S3, no provider that can pull the plug on the demo.

**Tool:** `site-builder` CLI (official Walrus Sites publisher)

**Install:**
```bash
cargo install --git https://github.com/MystenLabs/walrus-sites site-builder
```

**Site config — `sites-config.yaml` at frontend root:**
```yaml
module: site_builder
package: 0xWALRUS_SITES_PACKAGE_ID   # mainnet/testnet package per Walrus docs
portal: walrus.site
general:
  rpc_url: https://fullnode.mainnet.sui.io:443
  walrus_binary: walrus
  walrus_config: ~/.config/walrus/client_config.yaml
  gas_budget: 500000000
```

**Next.js config — `next.config.ts`:**
```typescript
export default {
  output: 'export',          // static export, required for Walrus Sites
  trailingSlash: true,
  images: { unoptimized: true },
};
```

**Publish flow:**
```bash
# 1. Build static site
npm run build       # outputs ./out

# 2. Publish to Walrus
site-builder publish ./out --epochs 100

# 3. CLI prints the Sui object ID of the site
# → save to WALRUS_SITE_OBJECT_ID in .env
# → URL becomes https://<base36-of-object-id>.walrus.site
```

**Updating the site (republishes blobs, updates the pointer atomically):**
```bash
site-builder update <WALRUS_SITE_OBJECT_ID> ./out --epochs 100
```

**Demo line:** *"Open the dashboard at `<id>.walrus.site`. There is no server I could take down to hide what the agent did — including the page you're looking at right now."*

---

### 5.3 Core Services

#### ActionQueueService (`src/services/ActionQueueService.ts`)

**Responsibility:** Buffers incoming action logs in memory. Flushed every 30 seconds by `walrusBatchJob.ts`.

```typescript
export class ActionQueueService {
  private queue: Map<string, ActionLog[]> = new Map(); // sessionId → logs[]

  enqueue(log: ActionLog): void {
    const bucket = this.queue.get(log.sessionId) ?? [];
    bucket.push(log);
    this.queue.set(log.sessionId, bucket);
  }

  flush(sessionId?: string): Map<string, ActionLog[]> {
    if (sessionId) {
      const logs = this.queue.get(sessionId) ?? [];
      this.queue.delete(sessionId);
      return new Map([[sessionId, logs]]);
    }
    const snapshot = new Map(this.queue);
    this.queue.clear();
    return snapshot;
  }

  size(): number {
    let total = 0;
    this.queue.forEach(arr => (total += arr.length));
    return total;
  }
}
```

#### SuiAnchorService (`src/services/SuiAnchorService.ts`)

**Responsibility:** Signs and sends the one mainnet anchor tx per session end.

```typescript
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { createSuiClient } from './TatumRPCService';

export class SuiAnchorService {
  private keypair: Ed25519Keypair;
  private client = createSuiClient('mainnet');

  constructor() {
    this.keypair = Ed25519Keypair.fromSecretKey(
      Buffer.from(process.env.SUI_PRIVATE_KEY!, 'base64')
    );
  }

  async anchorSession(params: {
    sessionId: string;
    agentId: string;
    agentName: string;
    actionCount: number;
    blobId: string;
    suisqlObjectId: string;
  }): Promise<string> {
    const tx = new Transaction();

    tx.moveCall({
      target: `${process.env.COGNITO_PACKAGE_ID}::agent_ledger::anchor_session`,
      arguments: [
        tx.pure.string(params.sessionId),
        tx.pure.string(params.agentId),
        tx.pure.string(params.agentName),
        tx.pure.u64(params.actionCount),
        tx.pure.string(params.blobId),
        tx.pure.address(params.suisqlObjectId),
      ],
    });

    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: this.keypair,
    });

    return result.digest; // mainnet tx digest
  }
}
```

#### VerifyService (`src/services/VerifyService.ts`)

**Responsibility:** Proves an action's stored blob has not been tampered with. This is the service that turns "audit log" into **verifiable audit log** — the product's defining feature.

**The proof chain it checks (all four must pass):**
1. Fetch the raw blob from a Walrus aggregator using the `blob_id` stored in SuiSQL
2. Recompute the blob ID from the fetched bytes — Walrus blob IDs are derived from content, so any tampering breaks this step
3. Query the `SessionAnchored` event on Sui mainnet for the action's session
4. Confirm the on-chain event's `blob_id` matches the recomputed ID

```typescript
import { createSuiClient } from './TatumRPCService';
import { WalrusService } from './WalrusService';
import { SuiSQLService } from './SuiSQLService';

export interface VerifyProof {
  actionId: string;
  status: 'verified' | 'tampered' | 'unanchored';
  steps: {
    blobFetched: boolean;
    hashMatchesBlobId: boolean;
    onChainEventFound: boolean;
    onChainBlobIdMatches: boolean;
  };
  recomputedBlobId?: string;
  onChainBlobId?: string;
  mainnetTxDigest?: string;
  suiVisionUrl?: string;
}

export class VerifyService {
  constructor(
    private walrus: WalrusService,
    private suisql: SuiSQLService,
  ) {}

  async verifyAction(actionId: string): Promise<VerifyProof> {
    const action = await this.suisql.getAction(actionId);
    if (!action?.blobId) {
      return {
        actionId,
        status: 'unanchored',
        steps: {
          blobFetched: false,
          hashMatchesBlobId: false,
          onChainEventFound: false,
          onChainBlobIdMatches: false,
        },
      };
    }

    // Step 1+2: re-fetch and re-derive the blob ID
    const bytes = await this.walrus.readBlob(action.blobId);
    const recomputedBlobId = await this.walrus.computeBlobId(bytes);
    const hashMatchesBlobId = recomputedBlobId === action.blobId;

    // Step 3+4: check the on-chain SessionAnchored event
    const session = await this.suisql.getSession(action.sessionId);
    const client = createSuiClient('mainnet');
    let onChainEventFound = false;
    let onChainBlobIdMatches = false;
    let onChainBlobId: string | undefined;

    if (session?.mainnetTxDigest) {
      const tx = await client.getTransactionBlock({
        digest: session.mainnetTxDigest,
        options: { showEvents: true },
      });
      const event = tx.events?.find(e =>
        e.type.includes('::agent_ledger::SessionAnchored')
      );
      if (event) {
        onChainEventFound = true;
        onChainBlobId = (event.parsedJson as any).blob_id;
        onChainBlobIdMatches = onChainBlobId === action.blobId;
      }
    }

    const allPassed =
      hashMatchesBlobId && onChainEventFound && onChainBlobIdMatches;

    return {
      actionId,
      status: allPassed ? 'verified' : 'tampered',
      steps: {
        blobFetched: true,
        hashMatchesBlobId,
        onChainEventFound,
        onChainBlobIdMatches,
      },
      recomputedBlobId,
      onChainBlobId,
      mainnetTxDigest: session?.mainnetTxDigest,
      suiVisionUrl: session?.mainnetTxDigest
        ? `https://suivision.xyz/txblock/${session.mainnetTxDigest}`
        : undefined,
    };
  }
}
```

> **Note:** `WalrusService.computeBlobId(bytes)` uses the same blob-ID derivation function the Walrus SDK uses internally for `writeBlob`. The `@mysten/walrus` SDK exposes encoding utilities; if not directly available, perform a dry-run encode to derive the ID from bytes. The point is: the ID is a pure function of the bytes, so any tampering breaks the chain at step 2.

**Route — `src/routes/verify.ts`:**
```typescript
fastify.get<{ Params: { actionId: string } }>(
  '/api/verify/:actionId',
  async (req, reply) => {
    const proof = await verifyService.verifyAction(req.params.actionId);
    return reply.send(proof);
  }
);
```

**Mastra tool — `src/mastra/tools/verifyActionTool.ts`:**
```typescript
// Lets the agent itself audit its own past actions — self-aware integrity check
export const verifyActionTool = createTool({
  id: 'verify_action',
  description: 'Cryptographically verify that a logged action has not been tampered with',
  inputSchema: z.object({ actionId: z.string() }),
  execute: async ({ context }) => {
    const res = await fetch(`${API_BASE}/api/verify/${context.actionId}`, {
      headers: { 'x-api-key': process.env.COGNITO_API_KEY! },
    });
    return res.json();
  },
});
```

---

### 5.4 Database Schema

SuiSQL (SQLite-compatible) schema — persisted to Walrus testnet.

```sql
-- Agents registered with Cognito
CREATE TABLE IF NOT EXISTS agents (
  id           TEXT PRIMARY KEY,        -- e.g. "agent_abc123"
  name         TEXT NOT NULL,           -- human name
  created_at   INTEGER NOT NULL,        -- unix ms
  total_sessions INTEGER DEFAULT 0
);

-- Agent sessions (one per run)
CREATE TABLE IF NOT EXISTS sessions (
  id                TEXT PRIMARY KEY,   -- uuid
  agent_id          TEXT NOT NULL,
  started_at        INTEGER NOT NULL,   -- unix ms
  ended_at          INTEGER,            -- null if active
  action_count      INTEGER DEFAULT 0,
  blob_id           TEXT,               -- Walrus blob ID for this session's batch
  mainnet_tx_digest TEXT,               -- Sui mainnet anchor tx digest
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Individual action logs
CREATE TABLE IF NOT EXISTS actions (
  id              TEXT PRIMARY KEY,     -- uuid
  session_id      TEXT NOT NULL,
  agent_id        TEXT NOT NULL,
  ts              INTEGER NOT NULL,     -- unix ms
  action_type     TEXT NOT NULL,        -- e.g. "web_search", "code_write", "api_call"
  description     TEXT,                 -- human-readable summary
  blob_id         TEXT,                 -- Walrus blob ID for this action's payload
  parent_action_id TEXT,               -- for action dependency graph
  metadata        TEXT,                -- JSON string of extra data
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

---

### 5.5 Data Flow

```
Agent calls log_action tool
        │
        ▼
POST /api/log
        │
        ▼
Validate with zod ActionLogSchema
        │
        ▼
ActionQueueService.enqueue(log)
        │
        ▼
SuiSQLService.insertAction(log)   ← immediate, synchronous index update
        │
  [every 30s: walrusBatchJob]
        │
        ▼
ActionQueueService.flush()
        │
        ▼
WalrusService.writeBatch(entries)  ← async, background
        │
        ▼
Returns blobId
        │
        ▼
SuiSQLService.updateActionBlobId(blobId)
SuiSQLService.persist()            ← flush SuiSQL DB state to Walrus

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agent calls end_session tool
        │
        ▼
POST /api/session/end
        │
        ▼
Flush remaining queue → Walrus batch blob
        │
        ▼
SuiAnchorService.anchorSession({ blobId, actionCount, ... })
        │
        ▼
Returns mainnet tx digest
        │
        ▼
SuiSQLService.updateSession({ mainnet_tx_digest })
        │
        ▼
Response: { txDigest, blobId, suiVisionUrl }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User (or agent) clicks "Verify Integrity"
        │
        ▼
GET /api/verify/:actionId
        │
        ▼
VerifyService.verifyAction(actionId)
        │
        ▼
Step 1: Read blob bytes from Walrus aggregator
Step 2: Recompute blob ID from bytes — must match stored blobId
Step 3: Look up session.mainnet_tx_digest in SuiSQL
Step 4: Fetch the SessionAnchored event from Sui mainnet
Step 5: On-chain event.blob_id must match the recomputed blob ID
        │
        ▼
Response: VerifyProof {
  status: 'verified' | 'tampered' | 'unanchored',
  steps: { ...four booleans... },
  recomputedBlobId, onChainBlobId, mainnetTxDigest, suiVisionUrl
}
```

---

### 5.6 Background Jobs

#### Walrus Batch Job (`src/jobs/walrusBatchJob.ts`)

Runs every 30 seconds. Flushes the in-memory queue to Walrus.

```typescript
import cron from 'node-cron';
import { ActionQueueService } from '../services/ActionQueueService';
import { WalrusService } from '../services/WalrusService';
import { SuiSQLService } from '../services/SuiSQLService';
import logger from '../utils/logger';

export function startWalrusBatchJob(
  queue: ActionQueueService,
  walrus: WalrusService,
  suisql: SuiSQLService
) {
  cron.schedule('*/30 * * * * *', async () => {
    if (queue.size() === 0) return;

    const batches = queue.flush();

    for (const [sessionId, logs] of batches) {
      try {
        const blobId = await walrus.writeBatch(logs);
        for (const log of logs) {
          await suisql.updateActionBlobId(log.id, blobId);
        }
        await suisql.persist();
        logger.info(`Flushed ${logs.length} logs for session ${sessionId} → blob ${blobId}`);
      } catch (err) {
        logger.error(`Walrus batch write failed for session ${sessionId}`, err);
        // Re-enqueue on failure
        logs.forEach(log => queue.enqueue(log));
      }
    }
  });
}
```

---

### 5.7 Caching Strategy

**Tool:** Redis (ioredis)

| Cache Key | TTL | What is cached |
|---|---|---|
| `agent:${agentId}` | 5 min | Agent record from SuiSQL |
| `session:${sessionId}` | 2 min | Session record |
| `history:${agentId}` | 30 sec | Recent action history |
| `blob:${blobId}` | 60 min | Walrus blob bytes (expensive to re-fetch) |
| `mainnet:tx:${digest}` | permanent | Confirmed mainnet tx details |

**Implementation (`src/services/CacheService.ts`):**
```typescript
import Redis from 'ioredis';

export class CacheService {
  private redis = new Redis(process.env.REDIS_URL!);

  async get<T>(key: string): Promise<T | null> {
    const val = await this.redis.get(key);
    return val ? JSON.parse(val) : null;
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

---

### 5.8 Error Handling

**Pattern:** All service methods throw typed errors. Fastify catches them and returns consistent JSON.

```typescript
// src/types/errors.ts
export class WalrusWriteError extends Error {
  constructor(msg: string) { super(msg); this.name = 'WalrusWriteError'; }
}
export class SuiTxError extends Error {
  constructor(msg: string, public digest?: string) { super(msg); this.name = 'SuiTxError'; }
}
export class SuiSQLError extends Error {
  constructor(msg: string) { super(msg); this.name = 'SuiSQLError'; }
}
```

```typescript
// src/middleware/errorHandler.ts
export function errorHandler(error: Error, request: FastifyRequest, reply: FastifyReply) {
  const statusMap: Record<string, number> = {
    WalrusWriteError: 503,
    SuiTxError: 502,
    SuiSQLError: 503,
    ZodError: 400,
  };
  const status = statusMap[error.name] ?? 500;
  reply.status(status).send({
    error: error.name,
    message: error.message,
    timestamp: new Date().toISOString(),
  });
}
```

**Retry logic (`src/utils/retry.ts`):**
```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastErr: Error | undefined;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err as Error;
      await new Promise(r => setTimeout(r, baseDelayMs * 2 ** i));
    }
  }
  throw lastErr;
}
```

---

### 5.9 Security

1. **Inbound API auth:** All `/api/*` routes require `x-api-key: ${COGNITO_API_KEY}` header. Add `COGNITO_API_KEY` to `.env`.
2. **Private key:** Never log or expose `SUI_PRIVATE_KEY`. Only accessed in `SuiAnchorService`.
3. **Input validation:** Every route uses Zod schemas. Unknown fields are stripped.
4. **CORS:** Allow only `http://localhost:3000` in dev. Lock to your domain in prod.
5. **Rate limiting:** Fastify `@fastify/rate-limit` — max 30 req/min per IP on `/api/log`.
6. **No PII in logs:** Winston logger strips `privateKey`, `mnemonic` fields from structured logs.

---

### 5.10 Logging & Monitoring

```typescript
// src/utils/logger.ts
import winston from 'winston';

export default winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

**Log every:**
- Action received (info)
- Walrus write success/fail (info/error)
- SuiSQL persist (info)
- Mainnet anchor tx sent (info + digest)
- Retry attempts (warn)
- Cache hit/miss (debug)

---

### 5.11 Deployment

**For hackathon demo:** Run backend locally. No cloud needed.

```bash
# Install
npm install

# Dev
npm run dev      # tsx watch src/index.ts

# Build
npm run build    # tsc

# Start Redis (required)
redis-server &

# Run
npm start
```

**`package.json` scripts:**
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "deploy:move": "sui client publish --gas-budget 100000000 src/move/",
    "test:tatum": "curl -H 'x-api-key: $TATUM_API_KEY' https://sui-mainnet.gateway.tatum.io -d '{\"jsonrpc\":\"2.0\",\"method\":\"suix_getLatestSuiSystemState\",\"id\":1}'"
  }
}
```

---

## 6. Frontend Documentation

### 6.1 Folder Structure

```
cognito-frontend/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (nav, fonts)
│   │   ├── page.tsx                # / → redirect to /dashboard
│   │   ├── dashboard/
│   │   │   └── page.tsx            # /dashboard — overview
│   │   ├── agents/
│   │   │   ├── page.tsx            # /agents — agent list
│   │   │   └── [agentId]/
│   │   │       └── page.tsx        # /agents/:id — agent detail
│   │   ├── sessions/
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx        # /sessions/:id — session detail
│   │   └── graph/
│   │       └── [agentId]/
│   │           └── page.tsx        # /graph/:agentId — knowledge graph
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui base components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── agents/
│   │   │   ├── AgentCard.tsx
│   │   │   ├── AgentList.tsx
│   │   │   └── AgentBadge.tsx
│   │   ├── sessions/
│   │   │   ├── SessionCard.tsx
│   │   │   ├── SessionTimeline.tsx
│   │   │   └── SessionStatus.tsx
│   │   ├── actions/
│   │   │   ├── ActionEntry.tsx
│   │   │   ├── ActionTypeIcon.tsx
│   │   │   └── ActionDetail.tsx
│   │   ├── graph/
│   │   │   └── AgentGraph.tsx      # react-force-graph component
│   │   ├── blockchain/
│   │   │   ├── TxBadge.tsx         # SuiVision link badge
│   │   │   ├── BlobLink.tsx        # Walrus aggregator link
│   │   │   ├── VerifyPanel.tsx     # "Verify Integrity" — re-hash + on-chain check
│   │   │   └── NetworkBadge.tsx    # testnet / mainnet indicator
│   │   └── dashboard/
│   │       ├── StatsCard.tsx
│   │       └── ActivityFeed.tsx
│   │
│   ├── hooks/
│   │   ├── useAgents.ts
│   │   ├── useSessions.ts
│   │   ├── useActionHistory.ts
│   │   └── useBlob.ts
│   │
│   ├── lib/
│   │   ├── api.ts                  # Typed API client (fetch wrapper)
│   │   └── utils.ts                # cn(), formatTs(), truncateAddress()
│   │
│   ├── store/
│   │   └── appStore.ts             # Zustand store
│   │
│   └── types/
│       └── index.ts                # Shared types matching backend
│
├── .env.local
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

### 6.2 Pages & Screens

---

#### PAGE 1: Dashboard — `/dashboard`

**Purpose:** First thing judges see. Shows the system is alive.

**What's on the page:**
- Header: "Cognito" + tagline "Open, verifiable audit logs for AI agents"
- 4 stat cards: Total Agents / Total Sessions / Total Actions Logged / Mainnet Anchors
- Activity Feed: Last 10 actions across all agents (live-updating, polling every 5s)
- "Start Demo Agent" button → runs the demo Mastra agent, opens session view live
- "View on SuiVision" button → links to the latest mainnet anchor tx

**Components used:**
- `StatsCard` × 4
- `ActivityFeed`
- `NetworkBadge` (shows "Mainnet ✅ | Testnet ✅")

**API integrations:**
- `GET /api/stats` → total counts
- `GET /api/history/all?limit=10` → recent activity feed
- `POST /api/demo/run` → triggers demo agent (SSE stream for live updates)

**States:**
- Loading: skeleton cards
- Loaded: stats + feed
- Demo running: live feed animates with new entries
- Error: toast notification "Backend offline"

**MVP:** Stats + feed + demo button. All essential.
**Optional:** Real-time WebSocket feed instead of polling.

---

#### PAGE 2: Agent List — `/agents`

**Purpose:** Shows all agents registered with Cognito.

**What's on the page:**
- Page title: "Agents"
- Search input (filter by name)
- Agent cards grid (responsive 1→2→3 cols):
  - Agent name
  - Agent ID (truncated, copy button)
  - Total sessions count
  - Total actions count
  - Last active timestamp
  - "View History" button → `/agents/:id`
  - "View Graph" button → `/graph/:id`

**Components used:**
- `AgentCard` × N
- `AgentBadge` (active/inactive)

**API integrations:**
- `GET /api/agents` → list all agents

**States:**
- Loading: skeleton cards
- Empty: "No agents yet. Run the demo to get started."
- Loaded: card grid

**MVP:** Card grid with View buttons. Essential for judges to navigate.
**Optional:** Add agent form (register new agent manually).

---

#### PAGE 3: Agent Detail — `/agents/:agentId`

**Purpose:** Deep-dive into one agent's full history.

**What's on the page:**
- Agent header: name, ID, created date, total stats
- Tab bar: **Timeline** | **Sessions** | **Raw Blobs**
- **Timeline tab:** Chronological list of every action
  - Action type icon (color-coded by type)
  - Timestamp
  - Description
  - Blob link (Walrus) if available
  - Parent action link (if nested)
- **Sessions tab:** All sessions for this agent
  - Session ID, start/end time, action count
  - Mainnet anchor badge (with SuiVision link) if anchored
  - Status: active / completed
- **Raw Blobs tab:** All Walrus blob IDs with aggregator links

**Components used:**
- `SessionTimeline`
- `SessionCard`
- `ActionEntry`
- `BlobLink`
- `TxBadge`

**API integrations:**
- `GET /api/history/:agentId` → action list
- `GET /api/sessions/:agentId` → session list

**States:**
- Loading: skeleton timeline
- Empty: "No actions yet"
- Loaded: tabs with data
- Action expanded: inline drawer showing full metadata JSON

**MVP:** Timeline + Sessions tabs. Core of the product.
**Optional:** Raw Blobs tab, action search/filter.

---

#### PAGE 4: Session Detail — `/sessions/:sessionId`

**Purpose:** Shows exactly what happened in one agent session.

**What's on the page:**
- Session header: ID, agent name, start → end time, total actions
- **Mainnet Anchor Panel** (hero element for judges):
  - Sui mainnet tx digest (full, copyable)
  - "Verify on SuiVision" button → opens `https://suivision.xyz/txblock/{digest}`
  - "View Blob on Walrus" button → opens `https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blobId}`
  - Green "Anchored ✅" badge
- **Verify Integrity Panel** (the killer demo moment — see §6.3 `VerifyPanel.tsx`):
  - One-click "Verify Integrity" button → calls `GET /api/verify/:actionId`
  - Live result UI: four checkmarks animate in as each step passes
    - ✅ Blob fetched from Walrus
    - ✅ Hash matches blob ID (content unchanged)
    - ✅ SessionAnchored event found on Sui mainnet
    - ✅ On-chain blob ID matches recomputed ID
  - Final status badge: 🟢 **Cryptographically Verified** / 🔴 **TAMPERED** / 🟡 **Unanchored**
  - Tooltip on each step explains what was checked
  - "Re-run with public RPC" toggle — proves verification works without Cognito's backend (uses `NEXT_PUBLIC_SUI_PUBLIC_RPC`)
- Action timeline: every action in order
  - Each action has: type icon, timestamp, description, blob badge
  - Clicking an action opens a detail drawer with raw JSON payload

**Components used:**
- `SessionStatus` (Active / Anchored / Pending)
- `TxBadge` (hero)
- `BlobLink`
- `VerifyPanel` (verify integrity hero — see §6.3)
- `ActionDetail` (drawer)
- `SessionTimeline`

**API integrations:**
- `GET /api/sessions/:sessionId` → session detail
- `GET /api/history?sessionId=${id}` → actions for this session
- `GET /api/verify/:actionId` → integrity proof (Walrus re-hash + on-chain match)

**States:**
- Active session: "Recording..." spinner, actions streaming in
- Anchored session: Full mainnet proof panel visible
- Error: "Session not found"

**MVP:** Full session view + mainnet anchor panel. This is the money shot for judges.
**Optional:** Export session as JSON/CSV.

---

#### PAGE 5: Knowledge Graph — `/graph/:agentId`

**Purpose:** Visual "wow" factor. Shows agent actions as a connected graph.

**What's on the page:**
- Full-screen graph canvas (react-force-graph)
- Graph nodes = individual actions
- Graph edges = parent → child action relationships (parent_action_id)
- Node colors by action_type:
  - `web_search` → blue
  - `code_write` → green
  - `api_call` → purple
  - `decision` → orange
  - `tool_use` → teal
- Clicking a node → sidebar shows action detail
- Top-left controls: zoom in/out, reset, export PNG
- Top-right: agent name badge + session selector dropdown

**Components used:**
- `AgentGraph` (react-force-graph wrapper)
- `ActionDetail` (sidebar panel on node click)
- `SessionStatus`

**API integrations:**
- `GET /api/graph/:agentId` → returns `{ nodes: [], edges: [] }` formatted for force-graph

**States:**
- Loading: spinner overlay on graph canvas
- Loaded: animated graph renders with physics simulation
- Node clicked: right panel slides in
- Empty (no parent relationships): flat star pattern from root node

**MVP:** Working force-graph with colored nodes. Extremely high visual impact for judges.
**Optional:** 3D graph toggle (react-force-graph supports 3D), time-scrubber to replay session.

---

### 6.3 Component Library

All components use Tailwind + shadcn/ui. Key reusable components:

#### `TxBadge.tsx`
```tsx
// Shows mainnet tx with SuiVision link
interface TxBadgeProps {
  digest: string;
  network?: 'mainnet' | 'testnet';
}
export function TxBadge({ digest, network = 'mainnet' }: TxBadgeProps) {
  const url = `${process.env.NEXT_PUBLIC_SUIVISION_BASE}/txblock/${digest}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
       className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-mono border border-green-500/20 hover:bg-green-500/20 transition-colors">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      {network === 'mainnet' ? '⛓ Mainnet' : 'Testnet'} · {digest.slice(0, 8)}...
    </a>
  );
}
```

#### `BlobLink.tsx`
```tsx
interface BlobLinkProps { blobId: string; }
export function BlobLink({ blobId }: BlobLinkProps) {
  const url = `${process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
       className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-mono hover:bg-blue-500/20 transition-colors">
      🌊 {blobId.slice(0, 12)}...
    </a>
  );
}
```

#### `VerifyPanel.tsx`
```tsx
// One-click cryptographic integrity proof — the core "verifiable" UX
import { useState } from 'react';
import { api } from '@/lib/api';

interface VerifyPanelProps { actionId: string; }

type Step = { label: string; passed: boolean | null };

export function VerifyPanel({ actionId }: VerifyPanelProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function runVerify() {
    setRunning(true);
    setResult(null);
    const proof = await api.get(`/verify/${actionId}`);
    setResult(proof);
    setRunning(false);
  }

  const steps: Step[] = result
    ? [
        { label: 'Blob fetched from Walrus', passed: result.steps.blobFetched },
        { label: 'Hash matches blob ID (no tampering)', passed: result.steps.hashMatchesBlobId },
        { label: 'SessionAnchored event found on Sui', passed: result.steps.onChainEventFound },
        { label: 'On-chain blob ID matches recomputed ID', passed: result.steps.onChainBlobIdMatches },
      ]
    : [];

  const statusColor =
    result?.status === 'verified' ? 'bg-green-500/10 border-green-500/40 text-green-400'
    : result?.status === 'tampered' ? 'bg-red-500/10 border-red-500/40 text-red-400'
    : 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400';

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-200">Verify Integrity</h3>
        <button
          onClick={runVerify}
          disabled={running}
          className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium disabled:opacity-50"
        >
          {running ? 'Verifying...' : 'Run Verification'}
        </button>
      </div>

      {result && (
        <>
          <div className={`rounded-lg border px-3 py-2 mb-3 ${statusColor}`}>
            {result.status === 'verified' && '🟢 Cryptographically Verified'}
            {result.status === 'tampered' && '🔴 TAMPERED — blob does not match anchor'}
            {result.status === 'unanchored' && '🟡 Unanchored — session not yet anchored to mainnet'}
          </div>
          <ul className="space-y-1.5">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                <span>{s.passed ? '✅' : '❌'}</span>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
```

#### `ActionTypeIcon.tsx`
```tsx
const typeConfig: Record<string, { icon: string; color: string }> = {
  web_search:  { icon: '🔍', color: 'text-blue-400' },
  code_write:  { icon: '💻', color: 'text-green-400' },
  api_call:    { icon: '🔌', color: 'text-purple-400' },
  decision:    { icon: '🧠', color: 'text-orange-400' },
  tool_use:    { icon: '🔧', color: 'text-teal-400' },
  default:     { icon: '📋', color: 'text-gray-400' },
};
export function ActionTypeIcon({ type }: { type: string }) {
  const cfg = typeConfig[type] ?? typeConfig.default;
  return <span className={`text-sm ${cfg.color}`}>{cfg.icon}</span>;
}
```

---

### 6.4 State Management

**Zustand store (`src/store/appStore.ts`):**
```typescript
import { create } from 'zustand';

interface AppStore {
  selectedAgentId: string | null;
  selectedSessionId: string | null;
  demoRunning: boolean;
  setSelectedAgent: (id: string | null) => void;
  setSelectedSession: (id: string | null) => void;
  setDemoRunning: (running: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  selectedAgentId: null,
  selectedSessionId: null,
  demoRunning: false,
  setSelectedAgent: (id) => set({ selectedAgentId: id }),
  setSelectedSession: (id) => set({ selectedSessionId: id }),
  setDemoRunning: (running) => set({ demoRunning: running }),
}));
```

**React Query for server state:**
```typescript
// src/hooks/useActionHistory.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useActionHistory(agentId: string) {
  return useQuery({
    queryKey: ['history', agentId],
    queryFn: () => api.get(`/history/${agentId}`),
    staleTime: 30_000,   // cache 30s (matches backend cache TTL)
    refetchInterval: 5_000, // poll every 5s for live updates
  });
}
```

---

### 6.5 Routing

```
/                     → redirect to /dashboard
/dashboard            → Dashboard
/agents               → Agent List
/agents/:agentId      → Agent Detail (tabs: timeline, sessions, blobs)
/sessions/:sessionId  → Session Detail
/graph/:agentId       → Knowledge Graph
```

All routes are statically typed via Next.js App Router. No auth required for hackathon demo.

---

### 6.6 API Integration Per Page

All frontend API calls go through `src/lib/api.ts`:

```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL;

export const api = {
  get: async <T>(path: string): Promise<T> => {
    const res = await fetch(`${BASE}/api${path}`, {
      headers: { 'x-api-key': process.env.NEXT_PUBLIC_COGNITO_KEY ?? '' },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  post: async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${BASE}/api${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_COGNITO_KEY ?? '',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
};
```

---

## 7. Integration Build Sequence

Follow this exact order. Each step validates the next.

### Day 1 — Smoke Test Every Service

**Morning (3h):**
```bash
# 1. Test Tatum RPC
curl -X POST https://sui-mainnet.gateway.tatum.io \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d '{"jsonrpc":"2.0","method":"suix_getLatestSuiSystemState","params":[],"id":1}'
# Expected: 200 + Sui system state JSON

# 2. Test Walrus testnet write
curl -X PUT "https://publisher.walrus-testnet.walrus.space/v1/store?epochs=5" \
  -H "Content-Type: application/octet-stream" \
  --data-binary '{"test":"hello cognito"}'
# Expected: {"newlyCreated":{"blobObject":{"blobId":"..."}}}

# 3. Test Walrus testnet read (use blobId from above)
curl "https://aggregator.walrus-testnet.walrus.space/v1/blobs/BLOB_ID"
# Expected: your JSON back
```

**Afternoon (4h):**
```bash
# 4. Install and test SuiSQL
npm install @fizzyflow/suisql suidouble
# Write a small test script: init DB → create table → insert row → query → persist
# Confirm it works on testnet; try mainnet config (network: 'mainnet')

# 5. Install Tatum MCP, test in Claude Desktop
npm install -g @tatumio/blockchain-mcp
# Add to claude_desktop_config.json, test gateway_execute_rpc with sui-mainnet
```

---

### Day 2 — Backend Foundation

- Set up Fastify server (`src/index.ts`)
- Implement all 4 routes: `/log`, `/session/start`, `/session/end`, `/health`
- Implement `ActionQueueService`, `WalrusService`, `SuiSQLService` (init + insert only)
- Set up Redis + `CacheService`
- Start `walrusBatchJob`
- Test full write flow: log action → queue → Walrus → SuiSQL

---

### Day 3 — Move Contract + Mainnet Anchor

- Write `agent_ledger.move` (already specified above)
- Deploy to Sui mainnet: `sui client publish --gas-budget 100000000 src/move/`
- Copy Package ID → `.env`
- Implement `SuiAnchorService`
- Test `/api/session/end` → produces real mainnet tx digest
- Verify tx on `https://suivision.xyz/txblock/{digest}` ✅

---

### Day 4 — Mastra Agent + Tools

- Set up Mastra instance with 4 tools:
  - `log_action` → POST /api/log
  - `query_history` → GET /api/history/:agentId
  - `read_blob` → GET /api/blob/:blobId
  - `end_session` → POST /api/session/end
- Write demo agent that:
  1. Starts a session
  2. Logs 5–10 actions (simulated web searches, code writes, decisions)
  3. Queries its own history (proves self-aware memory)
  4. Ends session (triggers mainnet anchor)
- Run demo end-to-end

---

### Day 5 — Frontend Foundation

- Init Next.js 14 app with Tailwind + shadcn/ui
- Build Navbar + Sidebar
- Build Dashboard page (stats + activity feed)
- Build Agent List page
- Wire up `api.ts` + React Query

---

### Day 6 — Frontend Core Pages

- Build Agent Detail page (timeline tab + sessions tab)
- Build Session Detail page (with mainnet anchor panel — this is critical for demo)
- Build `TxBadge`, `BlobLink`, `ActionTypeIcon` components
- Test full navigation flow

---

### Day 7 — Knowledge Graph

- Build `/graph/:agentId` page with `react-force-graph`
- Add `GET /api/graph/:agentId` backend endpoint
- Wire node colors by action type
- Test with real demo agent data

---

### Day 8 — Verify Integrity + Polish

- **Implement `VerifyService`** (`src/services/VerifyService.ts`) and the `GET /api/verify/:actionId` route
- **Add `WalrusService.computeBlobId(bytes)`** — same blob-ID derivation Walrus uses internally
- **Add `verify_action` Mastra tool** so the demo agent can self-audit at end of session
- **Build `VerifyPanel` component** and slot it into the Session Detail page next to the Mainnet Anchor Panel
- Test end-to-end happy path: log action → wait for Walrus flush → end session → click Verify → all four green checks
- Test the tamper case: point an action's `blobId` at a different blob in SuiSQL; verify should turn red on step 2
- Style everything (dark theme, clean typography)
- Write demo script: start agent → watch it log → end session → see mainnet tx → **click Verify → all four checks animate green** → view graph
- Add loading/error/empty states to all pages
- Test on mobile viewport

---

### Day 9 — Hardening

- Add retry logic to all Walrus writes
- Add Tatum fallback to public Sui fullnode URL
- Test with 50+ actions (stress test queue)
- Fix any SuiSQL persist timing issues

---

### Day 10 — Walrus Sites Deploy + Submission

- **Deploy the frontend to Walrus Sites (the demo must open from `.walrus.site`, not localhost):**
  1. Add `output: 'export'` to `next.config.ts`
  2. `npm run build` → produces `./out`
  3. Install `site-builder` CLI + author `sites-config.yaml`
  4. `site-builder publish ./out --epochs 100` → capture the Sui object ID
  5. Visit `https://<base36-id>.walrus.site` and confirm the dashboard loads end-to-end with no centralized host
  6. Save the URL + object ID to `.env` and put the URL at the top of the submission README
- Record demo video showing:
  1. Dashboard live — **opened via the `.walrus.site` URL, not localhost**
  2. Demo agent running (actions streaming in)
  3. Session ending → mainnet tx appearing
  4. SuiVision showing real tx
  5. Walrus blob link opening raw JSON
  6. **Click Verify Integrity → all four green checks animate in**
  7. Knowledge graph rendering
  8. Closing line: *"Nothing on this screen lives on a server I control. The data, the proofs, the dashboard — all on Walrus and Sui."*
- Write submission README (lead with the `.walrus.site` URL + an example verifiable session link)
- Submit

---

## 8. Judging Impact Map

| Judging Criterion | How Cognito Hits It |
|---|---|
| **Walrus Usage** | Every agent action batch stored as Walrus blob (testnet). Blob IDs in UI with direct aggregator links. |
| **Sui Integration** | SuiSQL persists index to Sui + Walrus. Mainnet anchor tx per session. Move contract deployed. |
| **Tatum RPC** | All Sui blockchain calls routed through Tatum gateway. MCP server used for agent's own blockchain queries. |
| **Novel Use Case** | AI agent audit logs are a real unsolved problem. Not another NFT minter. |
| **Technical Depth** | Full data stack: agent → queue → Walrus → SuiSQL → Sui → UI. Not a toy. |
| **Demo-ability** | One "run demo" button. Agent logs live. Mainnet tx appears in 10s. Graph renders. Judges can click SuiVision. |
| **UI Polish** | Knowledge graph is visually distinctive. Dark theme. Blockchain proof badges look production-ready. |
| **Verifiable, Not Just Logged** | One-click `VerifyPanel` re-fetches the blob, recomputes the hash, and matches it against the on-chain `SessionAnchored` event. Turns "verifiable" from a claim into a clickable feature judges can run themselves. |
| **Fully Decentralized Stack** | The dashboard itself is deployed to **Walrus Sites** at `<id>.walrus.site`. Storage (Walrus) + index (SuiSQL) + proofs (Sui mainnet) + UI (Walrus Sites) — no centralized host at any layer. |

---

*Cognito · Build Blueprint v1.1 · Verifiable + Uncensorable Edition · May 2026*
