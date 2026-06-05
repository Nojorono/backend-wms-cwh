import { ConfigService } from '@nestjs/config';

export const INBOUND_INTEGRATION_RMQ = {
  exchange: 'inbound.integration',
  queue: 'inbound.integration.process',
  routingKey: 'inbound.process',
  dlxExchange: 'inbound.integration.dlx',
  dlxRoutingKey: 'inbound.process.dlq',
} as const;

export const getInboundIntegrationRmqOptions = (configService?: ConfigService) => ({
  urls: [
    configService?.get<string>('RABBITMQ_URL') ??
      process.env.RABBITMQ_URL ??
      'amqp://localhost:5672',
  ],
  queue:
    configService?.get<string>('RMQ_INBOUND_INTEGRATION_QUEUE') ??
    process.env.RMQ_INBOUND_INTEGRATION_QUEUE ??
    INBOUND_INTEGRATION_RMQ.queue,
  queueOptions: {
    durable: true,
    arguments: {
      'x-dead-letter-exchange':
        configService?.get<string>('RMQ_INBOUND_INTEGRATION_DLX_EXCHANGE') ??
        process.env.RMQ_INBOUND_INTEGRATION_DLX_EXCHANGE ??
        INBOUND_INTEGRATION_RMQ.dlxExchange,
      'x-dead-letter-routing-key':
        configService?.get<string>('RMQ_INBOUND_INTEGRATION_DLX_ROUTING_KEY') ??
        process.env.RMQ_INBOUND_INTEGRATION_DLX_ROUTING_KEY ??
        INBOUND_INTEGRATION_RMQ.dlxRoutingKey,
    },
  },
  persistent: true,
});
