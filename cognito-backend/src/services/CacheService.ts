import Redis from 'ioredis';
import { config } from '../config';
import logger from '../utils/logger';

export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(config.REDIS_URL, {
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    this.redis.on('error', (err) => {
      logger.warn('Redis error', { error: err.message });
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const val = await this.redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async connect(): Promise<void> {
    await this.redis.connect();
  }
}

// TTL constants
export const TTL = {
  AGENT: 300,        // 5 min
  SESSION: 120,      // 2 min
  HISTORY: 30,       // 30 sec
  BLOB: 3600,        // 60 min
  MAINNET_TX: 0,     // permanent (no TTL)
} as const;
