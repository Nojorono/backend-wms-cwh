import { Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export interface RmqConnectionState {
  connectionEstablished: boolean;
  connectionAttempts: number;
}

export interface RmqConnectionConfig {
  maxAttempts: number;
  baseRetryDelayMs: number;
  serviceName: string;
}

export async function ensureRmqConnection(
  client: ClientProxy,
  logger: Logger,
  state: RmqConnectionState,
  config: RmqConnectionConfig,
): Promise<void> {
  if (state.connectionEstablished) {
    return;
  }

  state.connectionAttempts++;

  try {
    logger.log(
      `Connection attempt ${state.connectionAttempts}/${config.maxAttempts} to RabbitMQ ${config.serviceName} service...`,
    );

    await client.connect();
    logger.log('RabbitMQ connection established successfully');
    state.connectionEstablished = true;
    state.connectionAttempts = 0;
  } catch (error) {
    logger.error(
      `Failed to establish connection to RabbitMQ: ${error?.message || 'Unknown error'}`,
    );

    if (state.connectionAttempts < config.maxAttempts) {
      const delay = config.baseRetryDelayMs * Math.pow(1.5, state.connectionAttempts - 1);
      logger.log(`Retrying connection in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return ensureRmqConnection(client, logger, state, config);
    }

    logger.error(
      `Maximum connection attempts (${config.maxAttempts}) reached. Service will work in fallback mode.`,
    );
    state.connectionAttempts = 0;
  }
}
