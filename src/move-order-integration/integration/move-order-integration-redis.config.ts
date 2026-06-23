import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export const MOVE_ORDER_INTEGRATION_REDIS = {
  /** Redis list for Oracle insert jobs only (create_with_lines). */
  insertQueueKey: 'move_order.integration.insert.queue',
} as const;

export const getMoveOrderIntegrationRedisOptions = (
  configService?: ConfigService,
): RedisOptions => {
  const host =
    configService?.get<string>('REDIS_HOST') ?? process.env.REDIS_HOST ?? 'localhost';
  const port = Number(
    configService?.get<string>('REDIS_PORT') ?? process.env.REDIS_PORT ?? '6379',
  );
  const password =
    configService?.get<string>('REDIS_PASSWORD') ?? process.env.REDIS_PASSWORD ?? undefined;
  const db = Number(configService?.get<string>('REDIS_DB') ?? process.env.REDIS_DB ?? '0');

  return {
    host,
    port: Number.isNaN(port) ? 6379 : port,
    password: password || undefined,
    db: Number.isNaN(db) ? 0 : db,
  };
};

export const getMoveOrderIntegrationQueueKey = (configService?: ConfigService): string =>
  configService?.get<string>('REDIS_MOVE_ORDER_INTEGRATION_QUEUE') ??
  process.env.REDIS_MOVE_ORDER_INTEGRATION_QUEUE ??
  MOVE_ORDER_INTEGRATION_REDIS.insertQueueKey;
