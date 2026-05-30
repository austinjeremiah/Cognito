import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { config } from '../../config';

const API_BASE = `http://localhost:${config.PORT}`;

export const logActionTool = createTool({
  id: 'log_action',
  description: 'Log an agent action to Cognito. Records the action to SuiSQL and queues it for Walrus blob storage. Returns an actionId you can use as parentActionId for subsequent actions.',
  inputSchema: z.object({
    sessionId: z.string().describe('The active session ID'),
    agentId: z.string().describe('The agent ID'),
    actionType: z.enum(['code_write', 'decision', 'api_call', 'web_search', 'tool_use', 'other']),
    description: z.string().max(2000).describe('What this action does — be specific and meaningful'),
    parentActionId: z.string().optional().describe('ID of the parent action (for DAG structure)'),
    metadata: z.record(z.unknown()).optional().describe('Extra data — use additionalParents[] for multi-parent edges'),
  }),
  execute: async (input) => {
    const res = await fetch(`${API_BASE}/api/log`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': config.COGNITO_API_KEY },
      body: JSON.stringify({
        sessionId: input.sessionId,
        agentId: input.agentId,
        actionType: input.actionType,
        description: input.description,
        parentActionId: input.parentActionId,
        metadata: input.metadata,
      }),
    });
    if (!res.ok) throw new Error(`log_action failed: ${res.status} ${await res.text()}`);
    return res.json() as Promise<{ actionId: string; ts: number; queued: boolean }>;
  },
});
