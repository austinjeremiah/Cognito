import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { requireApiKey } from '../middleware/auth';
import { suiSql, cache, queue } from '../services/container';
import { ValidationError } from '../types/errors';
import logger from '../utils/logger';

const logActionSchema = z.object({
  sessionId: z.string().min(1),
  agentId: z.string().min(1),
  actionType: z.enum(['code_write', 'decision', 'api_call', 'web_search', 'tool_use', 'other']),
  description: z.string().min(1).max(2000),
  parentActionId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function logRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/log', { preHandler: requireApiKey }, async (req, reply) => {
    const result = logActionSchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e) => e.message).join(', '));
    }

    const data = result.data;
    const actionId = uuidv4();
    const now = Date.now();

    const action = {
      id: actionId,
      sessionId: data.sessionId,
      agentId: data.agentId,
      ts: now,
      actionType: data.actionType,
      description: data.description,
      parentActionId: data.parentActionId,
      metadata: data.metadata,
    };

    await suiSql.insertAction(action);

    const session = await suiSql.getSession(data.sessionId);
    if (session) {
      await suiSql.updateSession(data.sessionId, { actionCount: session.actionCount + 1 });
    }

    queue.enqueue(action);

    await cache.del(`history:${data.agentId}`);
    await cache.del(`session-actions:${data.sessionId}`);

    logger.info('Action logged', { actionId, sessionId: data.sessionId, type: data.actionType });

    return reply.status(201).send({ actionId, ts: now, queued: true });
  });
}
