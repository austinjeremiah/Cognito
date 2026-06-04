import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { config } from '../../config';

const API_BASE = `http://localhost:${config.PORT}`;

export const logActionTool = createTool({
  id: 'log_action',
  description: 'Log an agent action to Cognito. Returns an actionId — pass it as parentActionId to the next action.',
  inputSchema: z.object({
    sessionId:      z.string().describe('The active session ID'),
    agentId:        z.string().describe('The agent ID'),
    actionType:     z.enum(['code_write', 'decision', 'api_call', 'web_search', 'tool_use', 'other']),
    description:    z.string().max(2000).describe('What this action does'),
    parentActionId: z.string().describe('actionId of the parent action. Pass empty string "" for the first/root action.'),
    metadata:       z.string().describe('Extra data as a JSON string. Pass "{}" if none. Example: "{\\"key\\": \\"value\\"}"'),
  }),
  execute: async (input) => {
    const body: Record<string, unknown> = {
      sessionId:   input.sessionId,
      agentId:     input.agentId,
      actionType:  input.actionType,
      description: input.description,
    };
    if (input.parentActionId) body.parentActionId = input.parentActionId;
    if (input.metadata && input.metadata !== '{}') {
      try { body.metadata = JSON.parse(input.metadata); } catch { /* ignore malformed metadata */ }
    }

    const res = await fetch(`${API_BASE}/api/log`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': config.COGNITO_API_KEY },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`log_action failed: ${res.status} ${await res.text()}`);
    return res.json() as Promise<{ actionId: string; ts: number; queued: boolean }>;
  },
});
