import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import logger from '../../utils/logger';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const API_KEY  = process.env.COGNITO_API_KEY ?? '';

export const makePaymentTool = createTool({
  id: 'make_payment',
  description: 'Make an x402 micropayment to access a premium paid API endpoint. Handles the full x402 flow: probe for payment requirements → pay via facilitator → fetch with payment proof. Returns the paid data and a payment receipt.',
  inputSchema: z.object({
    url:         z.string().describe('The x402-protected URL to fetch'),
    description: z.string().describe('Human-readable description of what is being purchased'),
  }),
  outputSchema: z.object({
    success:       z.boolean(),
    data:          z.unknown().optional(),
    amountPaid:    z.string().optional(),
    network:       z.string().optional(),
    paymentToken:  z.string().optional(),
    error:         z.string().optional(),
  }),
  execute: async (input) => {
    const { url, description } = input;
    logger.info('makePaymentTool: starting x402 flow', { url, description });

    try {
      // Step 1: probe — check if endpoint requires payment
      const probe = await fetch(url, {
        headers: { 'x-api-key': API_KEY },
      });

      if (probe.status !== 402) {
        // No payment required — return data directly
        const data = await probe.json();
        return { success: true, data, amountPaid: '0', network: 'none' };
      }

      const requirements = await probe.json() as {
        accepts?: Array<{ facilitator: string; maxAmount: string; network: string }>;
      };

      const accept = requirements.accepts?.[0];
      if (!accept) {
        return { success: false, error: 'No payment method accepted by server' };
      }

      logger.info('makePaymentTool: 402 received, contacting facilitator', {
        facilitator: accept.facilitator,
        amount: accept.maxAmount,
        network: accept.network,
      });

      // Step 2: call facilitator to obtain payment token
      const facResp = await fetch(accept.facilitator, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ url, amount: accept.maxAmount, network: accept.network }),
      });

      if (!facResp.ok) {
        return { success: false, error: `Facilitator error: ${facResp.status}` };
      }

      const { token, amount, network } = await facResp.json() as { token: string; amount: string; network: string };

      // Step 3: retry with payment proof
      const paid = await fetch(url, {
        headers: { 'x-api-key': API_KEY, 'x-payment': token },
      });

      if (!paid.ok) {
        return { success: false, error: `Paid request failed: ${paid.status}` };
      }

      const data = await paid.json();
      logger.info('makePaymentTool: payment successful', { amount, network });

      return {
        success:      true,
        data,
        amountPaid:   amount,
        network,
        paymentToken: token.slice(0, 16) + '…',
      };

    } catch (err) {
      const msg = (err as Error).message;
      logger.error('makePaymentTool: error', { error: msg });
      return { success: false, error: msg };
    }
  },
});
