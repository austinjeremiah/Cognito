# Cognito Demo Script

## The Money Shot
Session `a746235c-26f8-4002-bb3f-f03364fa9910` (cognito-security-auditor agent)
→ localhost:3000/sessions/a746235c-26f8-4002-bb3f-f03364fa9910
→ Click "Run Verification" → 4 green checks → "Verified — data integrity confirmed"

This is the ONLY session to show for the integrity proof demo.

---

## Why some sessions are Unanchored and some are Verified

**Anchored (show this):**
- The security auditor session ran `npm run seed` end-to-end
- All 19 actions were logged → batched into a Walrus blob → blob ID anchored on-chain via Tatum RPC
- Verification passes all 4 steps: blob fetched, action found in blob, on-chain event exists, on-chain blob ID matches

**Unanchored (explain briefly, don't dwell):**
- These are extra partial sessions from test runs of `npm run demo`
- The demo agent only runs 5 actions for a live demo — not enough to trigger a full Walrus + anchor cycle
- They have a Walrus blob (steps 1+2 pass) but no mainnet tx yet (steps 3+4 fail)
- This is expected and actually demonstrates the system working correctly:
  "Only fully completed, anchored sessions can be fully verified. Partial sessions show data is stored on Walrus but not yet committed on-chain."

---

## Demo Flow (recommended order)

1. **Landing page** — show the 4 feature cards, emphasize Tatum first
2. **Dashboard** (`/dashboard`) — show live stats: 2 agents, 20+ sessions, 200+ actions, 2 anchors
3. **Agents** (`/agents`) — show the two agents, click "View History" on cognito-security-auditor
4. **Agent detail** (`/agents/cognito-security-auditor`) — Timeline tab: show the full audit chain, each action logged with blob link
5. **Sessions tab** — show multiple sessions, point out the "Anchored" badge on the main session
6. **Session detail** (`/sessions/a746235c-...`) — THE DEMO MOMENT:
   - "19 actions, stored in Walrus blob p7ev4XNH, anchored on-chain"
   - Click "Run Verification"
   - 4 green checks animate in
   - "Verified — data integrity confirmed"
   - Click the Anchor tx badge → opens SuiVision showing the real on-chain transaction
   - Click the blob badge → opens raw Walrus data (the actual stored actions as JSON)
7. **Run live demo** — in a separate terminal, run `npm run demo` in the backend
   - Switch back to dashboard — new actions appear in the feed in real time

---

## Key talking points

- **Tatum** is the RPC gateway for every Sui call — the anchor tx, the event query, the verification. Without Tatum, there is no on-chain proof.
- **Walrus** is permanent decentralized storage — the blob URL will work forever, not relying on any server we control
- **SuiVision** link is the cryptographic receipt — anyone in the world can verify this transaction independently
- The "Unanchored" sessions prove the system is honest — it doesn't fake verification for incomplete data

---

## Commands to have ready

```bash
# Backend
cd cognito-backend
npm run seed     # re-populate full 19-action audit session (idempotent)
npm run demo     # run live 5-action demo agent (do this on stage)

# Frontend
cd frontend
pnpm dev         # localhost:3000
```
