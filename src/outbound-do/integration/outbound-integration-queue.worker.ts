import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsumeMessage, connect } from 'amqplib';
import { OutboundIntegrationQueueConsumer } from './outbound-integration-queue.consumer';
import { OUTBOUND_INTEGRATION_RMQ } from './outbound-integration-rmq.config';
import { OutboundJobPayload } from './outbound-integration-queue.types';

@Injectable()
export class OutboundIntegrationQueueWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboundIntegrationQueueWorker.name);
  private connection: any = null;
  private channel: any = null;
  private consumerTag: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly consumer: OutboundIntegrationQueueConsumer,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.startConsumer();
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.channel && this.consumerTag) {
        await this.channel.cancel(this.consumerTag);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to cancel outbound queue consumer: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
    this.channel = null;
    this.connection = null;
    this.consumerTag = null;
  }

  private async startConsumer(): Promise<void> {
    const url =
      this.configService.get<string>('RABBITMQ_URL') ??
      process.env.RABBITMQ_URL ??
      'amqp://localhost:5672';
    const queue =
      this.configService.get<string>('RMQ_OUTBOUND_INTEGRATION_QUEUE') ??
      process.env.RMQ_OUTBOUND_INTEGRATION_QUEUE ??
      OUTBOUND_INTEGRATION_RMQ.queue;
    const exchange =
      this.configService.get<string>('RMQ_OUTBOUND_INTEGRATION_EXCHANGE') ??
      process.env.RMQ_OUTBOUND_INTEGRATION_EXCHANGE ??
      OUTBOUND_INTEGRATION_RMQ.exchange;
    const routingKey =
      this.configService.get<string>('RMQ_OUTBOUND_INTEGRATION_ROUTING_KEY') ??
      process.env.RMQ_OUTBOUND_INTEGRATION_ROUTING_KEY ??
      OUTBOUND_INTEGRATION_RMQ.routingKey;
    const dlxExchange =
      this.configService.get<string>('RMQ_OUTBOUND_INTEGRATION_DLX_EXCHANGE') ??
      process.env.RMQ_OUTBOUND_INTEGRATION_DLX_EXCHANGE ??
      OUTBOUND_INTEGRATION_RMQ.dlxExchange;
    const dlxRoutingKey =
      this.configService.get<string>('RMQ_OUTBOUND_INTEGRATION_DLX_ROUTING_KEY') ??
      process.env.RMQ_OUTBOUND_INTEGRATION_DLX_ROUTING_KEY ??
      OUTBOUND_INTEGRATION_RMQ.dlxRoutingKey;

    const connection = await connect(url);
    const channel = await connection.createChannel();

    this.connection = connection;
    this.channel = channel;

    await channel.prefetch(1);

    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertExchange(dlxExchange, 'topic', { durable: true });
    await channel.assertQueue(queue, {
      durable: true,
      deadLetterExchange: dlxExchange,
      deadLetterRoutingKey: dlxRoutingKey,
    });
    await channel.bindQueue(queue, exchange, routingKey);

    const consumeResult = await channel.consume(
      queue,
      async (msg) => {
        await this.onMessage(msg);
      },
      { noAck: false },
    );

    this.consumerTag = consumeResult.consumerTag;
    this.logger.log(
      `Outbound integration queue worker started queue=${queue} exchange=${exchange} routingKey=${routingKey}`,
    );
  }

  private async onMessage(message: ConsumeMessage | null): Promise<void> {
    if (!this.channel || !message) {
      return;
    }

    try {
      const parsed = this.parseMessageBody(message.content);
      const payload = this.extractOutboundPayload(parsed);
      if (!payload) {
        this.logger.warn('Outbound integration worker ignored message with invalid payload');
        this.channel.ack(message);
        return;
      }
      await this.consumer.handleOutboundProcess(payload);
      this.channel.ack(message);
    } catch (error) {
      this.logger.error(
        `Outbound integration worker failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.channel.nack(message, false, false);
    }
  }

  private parseMessageBody(content: Buffer): unknown {
    const raw = content.toString('utf8');
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  private extractOutboundPayload(value: unknown): OutboundJobPayload | null {
    if (typeof value !== 'object' || value == null) {
      return null;
    }
    const packet = value as Record<string, unknown>;
    const candidate =
      typeof packet.data === 'object' && packet.data != null
        ? (packet.data as Record<string, unknown>)
        : packet;
    const outboundDoId = candidate.outboundDoId;
    if (typeof outboundDoId !== 'string' || outboundDoId.trim() === '') {
      return null;
    }

    const retryCount = this.toNumber(candidate.retryCount, 0);
    const maxRetry = this.toNumber(candidate.maxRetry, 20);

    return {
      outboundDoId,
      retryCount,
      maxRetry,
    };
  }

  private toNumber(value: unknown, fallback: number): number {
    if (value == null || value === '') {
      return fallback;
    }
    const n = Number(value);
    return Number.isNaN(n) ? fallback : n;
  }
}
