import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './core/interceptors/response.interceptor';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { AuditLogInterceptor } from './core/interceptors/audit-log.interceptor';
import { UsersActivityService } from './users-activity/users-activity.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // // Get services from app context for interceptors and filters
  // const usersActivityService = app.get(UsersActivityService);
  // const reflector = app.get(Reflector);

  // // Global interceptors
  // app.useGlobalInterceptors(
  //   new ResponseInterceptor(),
  //   new AuditLogInterceptor(usersActivityService, reflector),
  // );

  // // Global filters
  // app.useGlobalFilters(new HttpExceptionFilter(usersActivityService));

  // Enable CORS
  app.enableCors();

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('WMS API')
    .setDescription('The WMS API description')
    .setVersion('1.0')
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
    },
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
