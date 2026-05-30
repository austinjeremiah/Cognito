import { ActionLog } from '../types/ActionLog';

export class ActionQueueService {
  private queue: Map<string, ActionLog[]> = new Map();

  enqueue(log: ActionLog): void {
    const bucket = this.queue.get(log.sessionId) ?? [];
    bucket.push(log);
    this.queue.set(log.sessionId, bucket);
  }

  flush(sessionId?: string): Map<string, ActionLog[]> {
    if (sessionId) {
      const logs = this.queue.get(sessionId) ?? [];
      this.queue.delete(sessionId);
      return new Map([[sessionId, logs]]);
    }
    const snapshot = new Map(this.queue);
    this.queue.clear();
    return snapshot;
  }

  peek(sessionId: string): ActionLog[] {
    return this.queue.get(sessionId) ?? [];
  }

  size(): number {
    let total = 0;
    this.queue.forEach((arr) => (total += arr.length));
    return total;
  }

  sessionCount(): number {
    return this.queue.size;
  }
}
