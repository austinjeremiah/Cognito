import { FastifyInstance } from 'fastify';
import { requireApiKey } from '../middleware/auth';
import { walrus, cache } from '../services/container';
import { TTL } from '../services/CacheService';
import { NotFoundError } from '../types/errors';

export async function blobRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/blob/:blobId', { preHandler: requireApiKey }, async (req, reply) => {
    const { blobId } = req.params as { blobId: string };

    const cacheKey = `blob:${blobId}`;
    const cachedB64 = await cache.get<string>(cacheKey);
    if (cachedB64) {
      const content = JSON.parse(Buffer.from(cachedB64, 'base64').toString('utf8'));
      return reply.send({ blobId, content, source: 'cache' });
    }

    let bytes: Uint8Array;
    try {
      bytes = await walrus.readBlob(blobId);
    } catch {
      throw new NotFoundError(`Blob ${blobId} not found`);
    }

    const content = JSON.parse(Buffer.from(bytes).toString('utf8'));
    await cache.set(cacheKey, Buffer.from(bytes).toString('base64'), TTL.BLOB);

    return reply.send({ blobId, content, source: 'walrus' });
  });
}
