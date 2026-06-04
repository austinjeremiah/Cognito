import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { requireApiKey } from '../middleware/auth';
import { suiSql, walrus, cache, queue } from '../services/container';
import { SuiAnchorService } from '../services/SuiAnchorService';
import { rememberSession } from '../services/MemWalService';
import { ValidationError, NotFoundError } from '../types/errors';
import { TTL } from '../services/CacheService';
import { config } from '../config';
import logger from '../utils/logger';

let anchorService: SuiAnchorService | null = null;
function getAnchorService(): SuiAnchorService {
  if (!anchorService) anchorService = new SuiAnchorService();
  return anchorService;
}

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

  app.post('/api/session/end', { preHandler: requireApiKey }, async (req, reply) => {
    const { sessionId } = req.body as { sessionId?: string };
    if (!sessionId) throw new ValidationError('sessionId is required');

    const session = await suiSql.getSession(sessionId);
    if (!session) throw new NotFoundError(`Session ${sessionId} not found`);

    const now = Date.now();

    // Flush any queued actions for this session to Walrus first
    const pendingBatches = queue.flush(sessionId);
    const pending = pendingBatches.get(sessionId) ?? [];
    let blobId = session.blobId;

    if (pending.length > 0) {
      try {
        blobId = await walrus.writeBatch(pending);
        for (const a of pending) {
          await suiSql.updateActionBlobId(a.id, blobId);
        }
        await suiSql.updateSession(sessionId, { blobId });
        logger.info('Flushed pending actions on session end', { sessionId, count: pending.length, blobId });
      } catch (err) {
        logger.error('Walrus flush failed on session end', { sessionId, error: (err as Error).message });
      }
    }

    // Mark session ended
    await suiSql.updateSession(sessionId, { endedAt: now });

    let anchorResult: { txDigest: string; suiVisionUrl: string } | null = null;

    // Anchor to Sui mainnet (only if contract is deployed and we have a blobId)
    if (config.COGNITO_PACKAGE_ID && blobId) {
      try {
        const agent = await suiSql.getAllAgents().then((a) => a.find((x) => x.id === session.agentId));
        anchorResult = await getAnchorService().anchorSession({
          sessionId,
          agentId: session.agentId,
          agentName: agent?.name ?? session.agentId,
          actionCount: session.actionCount + pending.length,
          blobId,
          suisqlObjectId: config.SUISQL_DB_OBJECT_ID ?? '0x0',
        });

        await suiSql.updateSession(sessionId, { mainnetTxDigest: anchorResult.txDigest });

        rememberSession(
          { id: sessionId, agentId: session.agentId, actionCount: session.actionCount + pending.length, blobId },
          anchorResult.txDigest,
        );
      } catch (err) {
        logger.error('Mainnet anchor failed (session still ended)', { sessionId, error: (err as Error).message });
      }
    } else {
      logger.warn('Skipping mainnet anchor — COGNITO_PACKAGE_ID not set or no blobId', { sessionId });
    }

    // Persist SuiSQL state to blockchain
    await suiSql.persist();

    // Invalidate caches
    await cache.del(`session:${sessionId}`);
    await cache.del(`session-actions:${sessionId}`);
    await cache.del(`history:${session.agentId}`);

    logger.info('Session ended', { sessionId, anchored: !!anchorResult });

    return reply.send({
      sessionId,
      endedAt: now,
      blobId,
      mainnetTxDigest: anchorResult?.txDigest ?? null,
      suiVisionUrl: anchorResult?.suiVisionUrl ?? null,
    });
  });
}
