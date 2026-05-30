import cron from 'node-cron';
import { WalrusService } from '../services/WalrusService';
import { SuiSQLService } from '../services/SuiSQLService';
import { ActionQueueService } from '../services/ActionQueueService';
import { CacheService } from '../services/CacheService';
import logger from '../utils/logger';

export function startWalrusBatchJob(
  walrus: WalrusService,
  suiSql: SuiSQLService,
  queue: ActionQueueService,
  cache: CacheService
): void {
  cron.schedule('*/30 * * * * *', async () => {
    if (queue.size() === 0) return;

    logger.info('Walrus batch flush', { pending: queue.size(), sessions: queue.sessionCount() });

    const batches = queue.flush();

    for (const [sessionId, actions] of batches.entries()) {
      if (!actions.length) continue;

      try {
        const blobId = await walrus.writeBatch(actions);

        for (const action of actions) {
          await suiSql.updateActionBlobId(action.id, blobId);
          await cache.del(`history:${action.agentId}`);
        }

        await suiSql.updateSession(sessionId, { blobId });

        logger.info('Batch flushed to Walrus', { sessionId, blobId, count: actions.length });
      } catch (err) {
        logger.error('Batch write failed, re-queuing', { sessionId, error: (err as Error).message });
        actions.forEach((a) => queue.enqueue(a));
      }
    }

    try {
      await suiSql.persist();
    } catch (err) {
      logger.error('SuiSQL persist failed after batch', { error: (err as Error).message });
    }
  });

  logger.info('Walrus batch job scheduled (30s interval)');
}
