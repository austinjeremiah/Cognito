import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireApiKey } from '../middleware/auth';
import { recall, health, isEnabled } from '../services/MemWalService';

const recallQuerySchema = z.object({
  q: z.string().min(1).max(500),
  topK: z.coerce.number().int().min(1).max(20).optional().default(5),
});

export async function memoryRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/memory/health', { preHandler: requireApiKey }, async (_req, reply) => {
    if (!await isEnabled()) {
      return reply.status(503).send({ ok: false, reason: 'MemWal not configured' });
    }
    const result = await health();
    return reply.status(result.ok ? 200 : 503).send(result);
  });

  app.get('/api/memory/recall', { preHandler: requireApiKey }, async (req, reply) => {
    if (!await isEnabled()) {
      return reply.status(503).send({ results: [], reason: 'MemWal not configured' });
    }

    const parsed = recallQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.errors.map((e) => e.message).join(', ') });
    }

    const { q, topK } = parsed.data;
    const results = await recall(q, topK);
    return reply.send({ results, total: results.length });
  });
}
