import { FastifyReply, FastifyRequest } from 'fastify';
import { ValidationError, NotFoundError, WalrusWriteError, SuiTxError, SuiSQLError } from '../types/errors';
import logger from '../utils/logger';

export function handleError(error: Error, _req: FastifyRequest, reply: FastifyReply): void {
  if (error instanceof ValidationError) {
    reply.status(400).send({ error: error.message });
  } else if (error instanceof NotFoundError) {
    reply.status(404).send({ error: error.message });
  } else if (error instanceof WalrusWriteError) {
    reply.status(502).send({ error: error.message });
  } else if (error instanceof SuiTxError) {
    reply.status(502).send({ error: error.message, digest: error.digest });
  } else if (error instanceof SuiSQLError) {
    reply.status(500).send({ error: error.message });
  } else if ('statusCode' in error && typeof (error as any).statusCode === 'number') {
    reply.status((error as any).statusCode).send({ error: error.message });
  } else {
    logger.error('Unhandled error', { error: error.message });
    reply.status(500).send({ error: 'Internal Server Error' });
  }
}
