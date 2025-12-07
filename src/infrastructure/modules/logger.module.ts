import { Module, Global } from '@nestjs/common';
import { AppLoggerService } from '../services/logger.service';
import { LoggingInterceptor } from '../../core/interceptors/logging.interceptor';

@Global()
@Module({
  providers: [AppLoggerService, LoggingInterceptor],
  exports: [AppLoggerService, LoggingInterceptor],
})
export class LoggerModule {}

