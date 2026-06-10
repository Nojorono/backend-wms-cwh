import { resolve } from 'path';
import type { Server } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './core/interceptors/response.interceptor';
import { AppLoggerService } from './infrastructure/services/logger.service';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';

const LISTEN_RETRY_ATTEMPTS = 10;
const LISTEN_RETRY_DELAY_MS = 1000;
const LISTEN_HOST = '0.0.0.0';

function configureHttpServer(app: INestApplication): void {
  const server = app.getHttpServer() as Server;
  server.keepAliveTimeout = 5_000;
  server.headersTimeout = 10_000;
}

function registerGracefulShutdown(app: INestApplication, logger: AppLoggerService): void {
  let isShuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    logger.warn(`Shutting down on ${signal}...`, 'Bootstrap');

    const server = app.getHttpServer() as Server;
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }

    await app.close();
    process.exit(0);
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

async function listenWithRetry(
  app: INestApplication,
  port: number,
  logger: AppLoggerService,
): Promise<void> {
  for (let attempt = 1; attempt <= LISTEN_RETRY_ATTEMPTS; attempt++) {
    try {
      await app.listen(port, LISTEN_HOST);
      configureHttpServer(app);
      return;
    } catch (error) {
      const errno = error as NodeJS.ErrnoException;
      const isPortInUse = errno.code === 'EADDRINUSE';

      if (!isPortInUse || attempt === LISTEN_RETRY_ATTEMPTS) {
        throw error;
      }

      logger.warn(
        `Port ${port} is still in use (attempt ${attempt}/${LISTEN_RETRY_ATTEMPTS}). Waiting for previous process to release it...`,
        'Bootstrap',
      );
      await new Promise((resolvePromise) => setTimeout(resolvePromise, LISTEN_RETRY_DELAY_MS * attempt));
    }
  }
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Initialize logger
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Get logging interceptor
  const loggingInterceptor = app.get(LoggingInterceptor);

  // Global interceptors
  app.useGlobalInterceptors(
    loggingInterceptor, // Log all requests/responses first
    new ResponseInterceptor(),
  );

  // Enable CORS
  app.enableCors();

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('WMS API')
    .setDescription('The WMS API description')
    .setVersion('1.0')
    .addServer('', 'Local Development Server')
    .addServer('/service-wms', 'Production Server (via Kong Gateway)')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      expand: false,
      docExpansion: 'none',
      defaultModelsExpandDepth: 0,
      defaultModelExpandDepth: 0,
      tryItOutEnabled: true,
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    },
  });

  registerGracefulShutdown(app, logger);

  const port = Number(process.env.PORT) || 3000;
  await listenWithRetry(app, port, logger);

  const baseUrl = `http://127.0.0.1:${port}`;
  const logDir = resolve(process.cwd(), process.env.LOG_DIR || 'logs');
  const env = process.env.NODE_ENV || 'development';

  logger.log(
    `Application started | baseUrl=${baseUrl} | swagger=${baseUrl}/api | env=${env} | logDir=${logDir} | port=${port}`,
    'Bootstrap',
  );
}

bootstrap().catch((error: unknown) => {
  console.error('Application failed to start', error);
  process.exit(1);
});
