import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';

export async function requireApiKey(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const key = req.headers['x-api-key'];
  if (!key || key !== config.COGNITO_API_KEY) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}
