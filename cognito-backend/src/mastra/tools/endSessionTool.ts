import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { config } from '../../config';

const API_BASE = `http://localhost:${config.PORT}`;

export const endSessionTool = createTool({
  id: 'end_session',
  description: 'End the current audit session. This flushes all pending actions to Walrus and anchors the session permanently to Sui mainnet. Returns the mainnet tx digest and a SuiVision link.',
  inputSchema: z.object({
    sessionId: z.string().describe('The session ID to end and anchor'),
  }),
  execute: async (input) => {
    const res = await fetch(`${API_BASE}/api/session/end`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': config.COGNITO_API_KEY },
      body: JSON.stringify({ sessionId: input.sessionId }),
    });
    if (!res.ok) throw new Error(`end_session failed: ${res.status} ${await res.text()}`);
    return res.json() as Promise<{
      sessionId: string;
      endedAt: number;
      blobId: string;
      mainnetTxDigest: string | null;
      suiVisionUrl: string | null;
    }>;
  },
});
