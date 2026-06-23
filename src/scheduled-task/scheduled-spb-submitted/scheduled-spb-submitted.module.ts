import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DoSuggestionModule } from '../../do-suggestion/do-suggestion.module';
import { ScheduledTaskModule } from '../scheduled-task.module';
import { ScheduledSpbSubmittedCallbackHandler } from './scheduled-spb-submitted-callback.handler';
import { ScheduledSpbSubmittedScheduler } from './scheduled-spb-submitted.scheduler';
import { ScheduledSpbSubmittedService } from './scheduled-spb-submitted.service';

@Module({
  imports: [ConfigModule, DoSuggestionModule, forwardRef(() => ScheduledTaskModule)],
  providers: [
    ScheduledSpbSubmittedService,
    ScheduledSpbSubmittedCallbackHandler,
    ScheduledSpbSubmittedScheduler,
  ],
  exports: [ScheduledSpbSubmittedService, ScheduledSpbSubmittedScheduler],
})
export class ScheduledSpbSubmittedModule {}
