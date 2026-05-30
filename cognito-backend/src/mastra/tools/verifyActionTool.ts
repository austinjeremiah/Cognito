import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { config } from '../../config';

const API_BASE = `http://localhost:${config.PORT}`;

export const verifyActionTool = createTool({
  id: 'verify_action',
  description: 'Cryptographically verify a logged action has not been tampered with. Re-fetches the blob from Walrus, recomputes the content hash, and matches it against the on-chain SessionAnchored event on Sui mainnet. Returns verified / tampered / unanchored.',
  inputSchema: z.object({
    actionId: z.string().describe('The action ID to verify'),
  }),
  execute: async (input) => {
    const res = await fetch(`${API_BASE}/api/verify/${encodeURIComponent(input.actionId)}`, {
      headers: { 'x-api-key': config.COGNITO_API_KEY },
    });
    if (!res.ok) throw new Error(`verify_action failed: ${res.status}`);
    return res.json();
  },
});
