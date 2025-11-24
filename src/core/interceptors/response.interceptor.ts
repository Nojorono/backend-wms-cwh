import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseInterface } from '../interfaces/response.interface';
import { formatDateToIndonesia } from '../utils/date-transformer.util';

/**
 * Recursively transforms Date objects to Indonesia timezone ISO strings for API responses
 * All timestamps are converted from UTC (database) to Indonesia timezone (WIB, UTC+7)
 */
function transformDates(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    // Convert UTC date to Indonesia timezone
    return formatDateToIndonesia(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => transformDates(item));
  }

  if (typeof obj === 'object') {
    const transformed: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        transformed[key] = transformDates(obj[key]);
      }
    }
    return transformed;
  }

  return obj;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseInterface<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseInterface<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const path = request.url;

    return next.handle().pipe(
      map((data) => {
        // Transform all dates to Indonesia timezone
        const transformedData = transformDates(data);

        // Check if response is already formatted (has success property)
        if (
          transformedData &&
          typeof transformedData === 'object' &&
          'success' in transformedData
        ) {
          // Response is already formatted, just add timestamp and path if not present
          return {
            ...transformedData,
            timestamp: transformedData.timestamp || formatDateToIndonesia(new Date()),
            path: transformedData.path || path,
          };
        }

        // Check if data is a paginated response (has data and meta properties)
        if (
          transformedData &&
          typeof transformedData === 'object' &&
          'data' in transformedData &&
          'meta' in transformedData
        ) {
          // For paginated responses, return the data directly without extra wrapping
          return {
            success: true,
            message: 'Operation successful',
            ...transformedData, // Spread the paginated response properties
            timestamp: formatDateToIndonesia(new Date()),
            path,
          };
        }

        // For regular responses, wrap in data property
        return {
          success: true,
          message: 'Operation successful',
          data: transformedData,
          timestamp: formatDateToIndonesia(new Date()),
          path,
        };
      }),
    );
  }
}
