import { resolve } from 'path';
import type { Server } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { freeDevPort } from './bootstrap/free-dev-port';
import { ResponseInterceptor } from './core/interceptors/response.interceptor';
import { AppLoggerService } from './infrastructure/services/logger.service';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';

const LISTEN_HOST = '0.0.0.0';

function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

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

    try {
      const server = app.getHttpServer() as Server;
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }

      await new Promise<void>((resolvePromise) => {
        server.close(() => resolvePromise());
        setTimeout(resolvePromise, 500);
      });

      await app.close();
    } catch (error) {
      logger.error(
        `Shutdown error: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        'Bootstrap',
      );
    }

    process.exit(0);
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(AppLoggerService);
  app.useLogger(logger);
  registerGracefulShutdown(app, logger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const loggingInterceptor = app.get(LoggingInterceptor);
  app.useGlobalInterceptors(loggingInterceptor, new ResponseInterceptor());
  app.enableCors();

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
      'JWT-auth',
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

  const port = Number(process.env.PORT) || 3000;

  if (isDevelopment()) {
    freeDevPort(port);
  }

  await app.listen(port, LISTEN_HOST);
  configureHttpServer(app);

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
