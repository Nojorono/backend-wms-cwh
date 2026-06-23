import { ConfigService } from '@nestjs/config';

/** Oracle move order microservice queue (create_with_lines, find_by_request_number). */
export const MOVE_ORDER_ORACLE_RMQ = {
  queue: 'move_order_queue',
} as const;

export const getMoveOrderOracleRmqOptions = (configService?: ConfigService) => ({
  urls: [
    configService?.get<string>('RABBITMQ_URL') ??
      process.env.RABBITMQ_URL ??
      'amqp://localhost:5672',
  ],
  queue:
    configService?.get<string>('RMQ_MOVE_ORDER_QUEUE') ??
    process.env.RMQ_MOVE_ORDER_QUEUE ??
    MOVE_ORDER_ORACLE_RMQ.queue,
  queueOptions: {
    durable: false,
  },
});

/** WMS move order integration status polling queue (same pattern as inbound/outbound). */
export const MOVE_ORDER_INTEGRATION_RMQ = {
  exchange: 'move_order.integration',
  queue: 'move_order.integration.process',
  routingKey: 'move_order.process',
  dlxExchange: 'move_order.integration.dlx',
  dlxRoutingKey: 'move_order.process.dlq',
} as const;

export const getMoveOrderIntegrationRmqOptions = (configService?: ConfigService) => ({
  urls: [
    configService?.get<string>('RABBITMQ_URL') ??
      process.env.RABBITMQ_URL ??
      'amqp://localhost:5672',
  ],
  queue:
    configService?.get<string>('RMQ_MOVE_ORDER_INTEGRATION_QUEUE') ??
    process.env.RMQ_MOVE_ORDER_INTEGRATION_QUEUE ??
    MOVE_ORDER_INTEGRATION_RMQ.queue,
  queueOptions: {
    durable: true,
    arguments: {
      'x-dead-letter-exchange':
        configService?.get<string>('RMQ_MOVE_ORDER_INTEGRATION_DLX_EXCHANGE') ??
        process.env.RMQ_MOVE_ORDER_INTEGRATION_DLX_EXCHANGE ??
        MOVE_ORDER_INTEGRATION_RMQ.dlxExchange,
      'x-dead-letter-routing-key':
        configService?.get<string>('RMQ_MOVE_ORDER_INTEGRATION_DLX_ROUTING_KEY') ??
        process.env.RMQ_MOVE_ORDER_INTEGRATION_DLX_ROUTING_KEY ??
        MOVE_ORDER_INTEGRATION_RMQ.dlxRoutingKey,
    },
  },
  persistent: true,
});
