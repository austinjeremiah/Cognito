import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import logger from './utils/logger';
import { handleError } from './middleware/errorHandler';
import { healthRoutes } from './routes/health';
import { sessionRoutes } from './routes/session';
import { logRoutes } from './routes/log';
import { historyRoutes } from './routes/history';
import { blobRoutes } from './routes/blob';
import { verifyRoutes } from './routes/verify';
import { graphRoutes } from './routes/graph';
import { memoryRoutes } from './routes/memory';
import { x402Routes } from './routes/x402';
import { explainRoutes } from './routes/explain';
import { suiSql, walrus, cache, queue } from './services/container';
import { startWalrusBatchJob } from './jobs/walrusBatchJob';

const app = Fastify({ logger: false });

async function bootstrap() {
  logger.info('Starting Cognito backend...');

  // Init services
  await cache.connect();
  logger.info('Redis connected');

  try {
    await suiSql.init();
    logger.info('SuiSQL initialized');
  } catch (err) {
    logger.warn('SuiSQL init failed — routes will return 503 until resolved', {
      error: (err as Error).message,
    });
  }

  // Background jobs
  startWalrusBatchJob(walrus, suiSql, queue, cache);

  // Plugins
  await app.register(cors, {
    origin:
      config.NODE_ENV === 'production'
        ? ['https://cognito.walrus.site']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  // Routes
  await app.register(healthRoutes);
  await app.register(sessionRoutes);
  await app.register(logRoutes);
  await app.register(historyRoutes);
  await app.register(blobRoutes);
  await app.register(verifyRoutes);
  await app.register(graphRoutes);
  await app.register(memoryRoutes);
  await app.register(x402Routes);
  await app.register(explainRoutes);

  app.setErrorHandler(handleError);

  await app.listen({ port: config.PORT, host: '0.0.0.0' });
  logger.info(`Cognito backend running on port ${config.PORT}`);
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
