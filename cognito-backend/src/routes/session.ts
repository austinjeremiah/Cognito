import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { requireApiKey } from '../middleware/auth';
import { suiSql, cache } from '../services/container';
import { ValidationError } from '../types/errors';
import { TTL } from '../services/CacheService';
import logger from '../utils/logger';

const startSessionSchema = z.object({
  agentId: z.string().min(1),
  agentName: z.string().min(1),
});

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/session/start', { preHandler: requireApiKey }, async (req, reply) => {
    const result = startSessionSchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e) => e.message).join(', '));
    }

    const { agentId, agentName } = result.data;
    const sessionId = uuidv4();
    const now = Date.now();

    await suiSql.upsertAgent({ id: agentId, name: agentName, createdAt: now, totalSessions: 1 });

    await suiSql.insertSession({ id: sessionId, agentId, startedAt: now, actionCount: 0 });

    await cache.del(`history:${agentId}`);

    logger.info('Session started', { sessionId, agentId });

    return reply.status(201).send({ sessionId, agentId, startedAt: now });
  });

  app.get('/api/session/:sessionId', { preHandler: requireApiKey }, async (req, reply) => {
    const { sessionId } = req.params as { sessionId: string };

    const cacheKey = `session:${sessionId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return reply.send(cached);

    const session = await suiSql.getSession(sessionId);
    if (!session) return reply.status(404).send({ error: 'Session not found' });

    await cache.set(cacheKey, session, TTL.SESSION);
    return reply.send(session);
  });
}
