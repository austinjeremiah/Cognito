import { FastifyInstance } from 'fastify';
import { requireApiKey } from '../middleware/auth';
import logger from '../utils/logger';

// ---------------------------------------------------------------------------
// Mock x402 premium data endpoint
//
// Real x402 flow:
//   1. Client GETs /api/premium/threat-intel → 402 + payment requirements
//   2. Client pays (via facilitator) → retries with X-PAYMENT header
//   3. Server validates → returns premium data
//
// For demo: our own backend acts as both the x402 server AND the facilitator.
// Swap FACILITATOR_URL + add a real EVM wallet env var to go live on Base.
// ---------------------------------------------------------------------------

const PRICE_USDC = '0.001';   // $0.001 per call
const NETWORK    = 'base-sepolia';  // swap to 'base' for mainnet

// Fake payment token issued by our mock facilitator
function isValidPaymentToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const { mock, exp } = JSON.parse(decoded);
    return mock === true && exp > Date.now();
  } catch {
    return false;
  }
}

function makeMockPaymentToken(): string {
  const payload = JSON.stringify({ mock: true, exp: Date.now() + 60_000, amount: PRICE_USDC, network: NETWORK });
  return Buffer.from(payload).toString('base64');
}

const THREAT_INTEL_DATA = {
  contract: 'agent_ledger.move',
  findings: [
    { severity: 'HIGH',   id: 'TI-001', title: 'Reentrancy window in anchor_session()',          detail: 'External call before state update on line 42. Attacker can re-enter and double-emit SessionAnchored.' },
    { severity: 'MEDIUM', id: 'TI-002', title: 'Missing signer whitelist on anchor_session()',    detail: 'Any address can emit SessionAnchored for any agent_id. Recommend capability-guard pattern.' },
    { severity: 'LOW',    id: 'TI-003', title: 'epoch_timestamp_ms granularity coarse (~1s)',    detail: 'Not exploitable but ordering within the same epoch is non-deterministic.' },
    { severity: 'INFO',   id: 'TI-004', title: 'All 7 SessionAnchored fields present',            detail: 'Event schema is complete and matches spec.' },
  ],
  dataProvider: 'CognitoThreatDB v1',
  pricePaid: PRICE_USDC,
  network: NETWORK,
  timestamp: Date.now(),
};

export async function x402Routes(app: FastifyInstance): Promise<void> {

  // ------------------------------------------------------------------
  // Mock facilitator — issues payment tokens
  // In production: replace with Coinbase's https://x402.org/facilitator
  // ------------------------------------------------------------------
  app.post('/api/x402/facilitate', { preHandler: requireApiKey }, async (_req, reply) => {
    const token = makeMockPaymentToken();
    logger.info('x402 mock facilitator issued token');
    return reply.send({ token, amount: PRICE_USDC, network: NETWORK });
  });

  // ------------------------------------------------------------------
  // x402-protected premium threat intelligence endpoint
  // ------------------------------------------------------------------
  app.get('/api/premium/threat-intel', { preHandler: requireApiKey }, async (req, reply) => {
    const paymentHeader = (req.headers['x-payment'] ?? req.headers['x-payment-token']) as string | undefined;

    if (!isValidPaymentToken(paymentHeader)) {
      return reply.status(402).send({
        x402Version: 1,
        error: 'Payment required',
        accepts: [{
          scheme:    'exact',
          network:   NETWORK,
          maxAmount: PRICE_USDC,
          currency:  'USDC',
          facilitator: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/x402/facilitate`,
          resource:  '/api/premium/threat-intel',
        }],
      });
    }

    logger.info('x402 premium endpoint: valid payment, returning threat intel');
    return reply.send(THREAT_INTEL_DATA);
  });
}
