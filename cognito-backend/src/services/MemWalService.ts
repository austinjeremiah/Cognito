import type { MemWal, RecallMemory } from '@mysten-incubation/memwal';
import type { ActionLog } from '../types/ActionLog';
import logger from '../utils/logger';

interface SessionSummary {
  id: string;
  agentId: string;
  actionCount: number;
  blobId?: string;
}

let client: MemWal | null = null;
let initAttempted = false;

async function getClient(): Promise<MemWal | null> {
  if (initAttempted) return client;
  initAttempted = true;

  const key = process.env.MEMWAL_PRIVATE_KEY;
  const accountId = process.env.MEMWAL_ACCOUNT_ID;

  if (!key || !accountId) {
    logger.warn('MemWal not configured — MEMWAL_PRIVATE_KEY or MEMWAL_ACCOUNT_ID missing');
    return null;
  }

  try {
    // Dynamic import required: package is ESM-only, backend is CJS
    const { MemWal: MemWalClass } = await import('@mysten-incubation/memwal');
    client = MemWalClass.create({
      key,
      accountId,
      serverUrl: process.env.MEMWAL_SERVER_URL ?? 'https://relayer.memwal.ai',
      namespace: 'cognito',
    });
    logger.info('MemWal client initialized');
  } catch (err) {
    logger.warn('MemWal init failed', { error: (err as Error).message });
  }

  return client;
}

export function rememberAction(action: ActionLog): void {
  const text = `Agent ${action.agentId} [${action.actionType}]: ${action.description} | actionId:${action.id} sessionId:${action.sessionId}`;

  getClient().then((memwal) => {
    if (!memwal) return;
    return memwal.remember(text);
  }).catch((err: Error) => {
    logger.warn('MemWal rememberAction failed', { actionId: action.id, error: err.message });
  });
}

export function rememberSession(session: SessionSummary, txDigest: string): void {
  const text = `Session ${session.id} completed. Agent ${session.agentId}, ${session.actionCount} actions. Walrus blob: ${session.blobId ?? 'none'}. Sui tx: ${txDigest}.`;

  getClient().then((memwal) => {
    if (!memwal) return;
    return memwal.remember(text);
  }).catch((err: Error) => {
    logger.warn('MemWal rememberSession failed', { sessionId: session.id, error: err.message });
  });
}

export async function recall(query: string, topK = 5): Promise<RecallMemory[]> {
  const memwal = await getClient();
  if (!memwal) return [];

  try {
    const result = await memwal.recall({ query, topK });
    return result.results;
  } catch (err) {
    logger.warn('MemWal recall failed', { error: (err as Error).message });
    return [];
  }
}

export async function health(): Promise<{ ok: boolean; latencyMs?: number }> {
  const memwal = await getClient();
  if (!memwal) return { ok: false };

  try {
    const start = Date.now();
    await memwal.health();
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false };
  }
}

export async function isEnabled(): Promise<boolean> {
  return !!(await getClient());
}
