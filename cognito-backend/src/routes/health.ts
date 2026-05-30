import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/api/health', async (_req, reply) => {
    return reply.send({
      status: 'ok',
      service: 'cognito-backend',
      timestamp: new Date().toISOString(),
    });
  });
}
