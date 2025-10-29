import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ResponseInterface } from '../interfaces/response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    const errorMessage =
      typeof errorResponse === 'string'
        ? errorResponse
        : (errorResponse as any).message || 'Internal server error';

    const responseBody: ResponseInterface<null> = {
      success: false,
      message: 'Operation failed',
      error: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(responseBody);
  }
}
