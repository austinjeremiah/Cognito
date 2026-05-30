import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { config } from '../../config';

const API_BASE = `http://localhost:${config.PORT}`;

export const queryHistoryTool = createTool({
  id: 'query_history',
  description: 'Retrieve your past logged actions from Cognito. Use this to review your own audit chain and confirm no steps were missed.',
  inputSchema: z.object({
    agentId: z.string().describe('The agent ID to query history for'),
    limit: z.number().min(1).max(200).default(50).describe('Max number of actions to return'),
  }),
  execute: async (input) => {
    const res = await fetch(`${API_BASE}/api/history/${encodeURIComponent(input.agentId)}?limit=${input.limit}`, {
      headers: { 'x-api-key': config.COGNITO_API_KEY },
    });
    if (!res.ok) throw new Error(`query_history failed: ${res.status}`);
    return res.json();
  },
});
