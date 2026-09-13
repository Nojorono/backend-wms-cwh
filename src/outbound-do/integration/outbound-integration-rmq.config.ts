import { ConfigService } from '@nestjs/config';

export const OUTBOUND_INTEGRATION_RMQ = {
  exchange: 'outbound.integration',
  queue: 'outbound.integration.process',
  routingKey: 'outbound.process',
  dlxExchange: 'outbound.integration.dlx',
  dlxRoutingKey: 'outbound.process.dlq',
} as const;

export const getOutboundIntegrationRmqOptions = (configService?: ConfigService) => ({
  urls: [
    configService?.get<string>('RABBITMQ_URL') ??
      process.env.RABBITMQ_URL ??
      'amqp://localhost:5672',
  ],
  queue:
    configService?.get<string>('RMQ_OUTBOUND_INTEGRATION_QUEUE') ??
    process.env.RMQ_OUTBOUND_INTEGRATION_QUEUE ??
    OUTBOUND_INTEGRATION_RMQ.queue,
  queueOptions: {
    durable: true,
    arguments: {
      'x-dead-letter-exchange':
        configService?.get<string>('RMQ_OUTBOUND_INTEGRATION_DLX_EXCHANGE') ??
        process.env.RMQ_OUTBOUND_INTEGRATION_DLX_EXCHANGE ??
        OUTBOUND_INTEGRATION_RMQ.dlxExchange,
      'x-dead-letter-routing-key':
        configService?.get<string>('RMQ_OUTBOUND_INTEGRATION_DLX_ROUTING_KEY') ??
        process.env.RMQ_OUTBOUND_INTEGRATION_DLX_ROUTING_KEY ??
        OUTBOUND_INTEGRATION_RMQ.dlxRoutingKey,
    },
  },
  persistent: true,
});
