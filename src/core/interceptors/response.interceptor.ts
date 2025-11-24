import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseInterface } from '../interfaces/response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseInterface<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseInterface<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const path = request.url;

    return next.handle().pipe(
      map((data) => {
        // Check if data is already a paginated response (has data and meta properties)
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          // For paginated responses, return the data directly without extra wrapping
          return {
            success: true,
            message: 'Operation successful',
            ...data, // Spread the paginated response properties
            timestamp: new Date().toISOString(),
            path,
          };
        }

        // For regular responses, wrap in data property
        return {
          success: true,
          message: 'Operation successful',
          data,
          timestamp: new Date().toISOString(),
          path,
        };
      }),
    );
  }
}