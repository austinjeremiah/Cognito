import logger from './logger';

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000,
  label = 'operation'
): Promise<T> {
  let lastErr: Error | undefined;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err as Error;
      const delay = baseDelayMs * 2 ** i;
      logger.warn(`${label} failed (attempt ${i + 1}/${maxRetries}), retrying in ${delay}ms`, {
        error: lastErr.message,
      });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
