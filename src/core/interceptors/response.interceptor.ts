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
        // Transform all dates to Indonesia timezone first
        const transformedData = transformDates(data);

        // Normalize all responses to standard structure: success, message, data, timestamp, path
        let normalizedResponse: any = {
          success: true,
          message: 'Operation successful',
          data: transformedData,
          timestamp: formatDateToIndonesia(new Date()),
          path,
        };

        // If response already has success property, normalize it
        if (
          transformedData &&
          typeof transformedData === 'object' &&
          'success' in transformedData
        ) {
          // Extract standard response fields
          const existingSuccess = transformedData.success;
          const existingMessage = transformedData.message || 'Operation successful';
          const existingTimestamp = transformedData.timestamp || formatDateToIndonesia(new Date());
          const existingPath = transformedData.path || path;
          const existingError = transformedData.error;

          // Extract all other fields into data
          const {
            success,
            message,
            timestamp,
            path: responsePath,
            error,
            ...restFields
          } = transformedData;

          // Determine what goes into data field
          let responseData: any;
          
          // If response already has 'data' property, use it
          if ('data' in transformedData && transformedData.data !== undefined) {
            // If data is an array, keep it as array
            if (Array.isArray(transformedData.data)) {
              responseData = transformedData.data;
            } else if (Object.keys(restFields).length > 0) {
              // If there are other fields besides standard ones, merge them with data
              responseData = {
                ...transformedData.data,
                ...restFields,
              };
            } else {
              responseData = transformedData.data;
            }
          } else {
            // No 'data' property, put all non-standard fields into data
            // If restFields is empty or transformedData is an array, use transformedData
            if (Array.isArray(transformedData)) {
              responseData = transformedData;
            } else {
              responseData = Object.keys(restFields).length > 0 ? restFields : transformedData;
            }
          }

          normalizedResponse = {
            success: existingSuccess,
            message: existingMessage,
            data: responseData,
            timestamp: existingTimestamp,
            path: existingPath,
          };

          // Include error field if present
          if (existingError !== undefined) {
            normalizedResponse.error = existingError;
          }
        } else if (
          transformedData &&
          typeof transformedData === 'object' &&
          'data' in transformedData &&
          'meta' in transformedData
        ) {
          // Paginated response - keep data and meta in data field
          normalizedResponse = {
            success: true,
            message: 'Operation successful',
            data: transformedData,
            timestamp: formatDateToIndonesia(new Date()),
            path,
          };
        }

        return normalizedResponse;
      }),
    );
  }
}
