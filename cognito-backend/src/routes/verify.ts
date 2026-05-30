import { FastifyInstance } from 'fastify';
import { requireApiKey } from '../middleware/auth';
import { walrus, suiSql } from '../services/container';
import { VerifyService } from '../services/VerifyService';

const verifyService = new VerifyService(walrus, suiSql);

export async function verifyRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/verify/:actionId', { preHandler: requireApiKey }, async (req, reply) => {
    const { actionId } = req.params as { actionId: string };
    const proof = await verifyService.verifyAction(actionId);
    return reply.send(proof);
  });
}
