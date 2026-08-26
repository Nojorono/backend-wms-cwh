import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoSuggestion } from '../core/domain/entities/do-suggestion.entity';
import { DoSuggestionDetail } from '../core/domain/entities/do-suggestion-detail.entity';
import { OnHandAtr } from '../core/domain/entities/on-hand-atr.entity';
import { MasterIO } from '../core/domain/entities/master-io.entity';
import { MoveOrderIntegrationModule } from '../move-order-integration/move-order-integration.module';
import { OutboundSalesModule } from '../outbound-sales/outbound-sales.module';
import { AuthModule } from '../infrastructure/modules/auth.module';
import { EmailModule } from '../email/email.module';
import { UserModule } from '../users/user.module';
import { DoSuggestionController } from './do-suggestion.controller';
import { DoSuggestionRepository } from './do-suggestion.repository';
import { DoSuggestionService } from './do-suggestion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoSuggestion, DoSuggestionDetail, OnHandAtr, MasterIO]),
    AuthModule,
    EmailModule,
    UserModule,
    MoveOrderIntegrationModule,
    forwardRef(() => OutboundSalesModule),
  ],
  controllers: [DoSuggestionController],
  providers: [DoSuggestionService, DoSuggestionRepository],
  exports: [DoSuggestionService, DoSuggestionRepository],
})
export class DoSuggestionModule {}
