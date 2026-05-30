import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { config } from '../../config';

const API_BASE = `http://localhost:${config.PORT}`;

export const readBlobTool = createTool({
  id: 'read_blob',
  description: 'Read a raw blob stored on Walrus by its blobId. Returns the decoded content.',
  inputSchema: z.object({
    blobId: z.string().describe('The Walrus blob ID to read'),
  }),
  execute: async (input) => {
    const res = await fetch(`${API_BASE}/api/blob/${encodeURIComponent(input.blobId)}`, {
      headers: { 'x-api-key': config.COGNITO_API_KEY },
    });
    if (!res.ok) throw new Error(`read_blob failed: ${res.status}`);
    return res.json();
  },
});
