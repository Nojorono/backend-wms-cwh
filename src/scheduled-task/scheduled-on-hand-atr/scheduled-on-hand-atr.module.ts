import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MasterIOModule } from '../../master-io/master-io.module';
import { OutboundSalesModule } from '../../outbound-sales/outbound-sales.module';
import { ScheduledTaskModule } from '../scheduled-task.module';
import { ScheduledOnHandAtrCallbackHandler } from './scheduled-on-hand-atr-callback.handler';
import { ScheduledOnHandAtrScheduler } from './scheduled-on-hand-atr.scheduler';
import { ScheduledOnHandAtrService } from './scheduled-on-hand-atr.service';

@Module({
  imports: [
    ConfigModule,
    MasterIOModule,
    OutboundSalesModule,
    forwardRef(() => ScheduledTaskModule),
  ],
  providers: [
    ScheduledOnHandAtrService,
    ScheduledOnHandAtrCallbackHandler,
    ScheduledOnHandAtrScheduler,
  ],
  exports: [ScheduledOnHandAtrService, ScheduledOnHandAtrScheduler],
})
export class ScheduledOnHandAtrModule {}
