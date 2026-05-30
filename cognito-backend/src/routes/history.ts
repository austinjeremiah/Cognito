import { FastifyInstance } from 'fastify';
import { requireApiKey } from '../middleware/auth';
import { suiSql, cache } from '../services/container';
import { TTL } from '../services/CacheService';
import { NotFoundError } from '../types/errors';
import { ActionLog } from '../types/ActionLog';

export async function historyRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/history/:agentId', { preHandler: requireApiKey }, async (req, reply) => {
    const { agentId } = req.params as { agentId: string };
    const { limit = '50' } = req.query as { limit?: string };

    const cacheKey = `history:${agentId}:${limit}`;
    const cached = await cache.get<ActionLog[]>(cacheKey);
    if (cached) return reply.send({ agentId, actions: cached, source: 'cache' });

    const actions = await suiSql.queryHistory(agentId, parseInt(limit, 10));
    await cache.set(cacheKey, actions, TTL.HISTORY);

    return reply.send({ agentId, actions, source: 'db' });
  });

  app.get('/api/session/:sessionId/actions', { preHandler: requireApiKey }, async (req, reply) => {
    const { sessionId } = req.params as { sessionId: string };

    const cacheKey = `session-actions:${sessionId}`;
    const cached = await cache.get<ActionLog[]>(cacheKey);
    if (cached) return reply.send({ sessionId, actions: cached, source: 'cache' });

    const session = await suiSql.getSession(sessionId);
    if (!session) throw new NotFoundError(`Session ${sessionId} not found`);

    const actions = await suiSql.querySessionActions(sessionId);
    await cache.set(cacheKey, actions, TTL.SESSION);

    return reply.send({ sessionId, actions, source: 'db' });
  });

  app.get('/api/agents', { preHandler: requireApiKey }, async (_req, reply) => {
    const cacheKey = 'agents:all';
    const cached = await cache.get(cacheKey);
    if (cached) return reply.send({ agents: cached, source: 'cache' });

    const agents = await suiSql.getAllAgents();
    await cache.set(cacheKey, agents, TTL.AGENT);

    return reply.send({ agents, source: 'db' });
  });

  app.get('/api/stats', { preHandler: requireApiKey }, async (_req, reply) => {
    const cacheKey = 'stats';
    const cached = await cache.get(cacheKey);
    if (cached) return reply.send(cached);

    const stats = await suiSql.getStats();
    await cache.set(cacheKey, stats, 60);

    return reply.send(stats);
  });
}
