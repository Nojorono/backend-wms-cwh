import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './core/interceptors/response.interceptor';
import { AppLoggerService } from './infrastructure/services/logger.service';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';

async function bootstrap() {
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
    .addServer('/service-wms', 'Production Server (via Kong Gateway)')
    .addServer('', 'Local Development Server')
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

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Log application startup
  logger.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api`, 'Bootstrap');
  logger.log(`📝 Logs directory: ${process.env.LOG_DIR || 'logs'}`, 'Bootstrap');
  logger.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`, 'Bootstrap');
}
bootstrap();
