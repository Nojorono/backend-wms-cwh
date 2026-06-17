import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoSuggestion } from '../core/domain/entities/do-suggestion.entity';
import { DoSuggestionDetail } from '../core/domain/entities/do-suggestion-detail.entity';
import { DoSuggestionController } from './do-suggestion.controller';
import { DoSuggestionRepository } from './do-suggestion.repository';
import { DoSuggestionService } from './do-suggestion.service';

@Module({
  imports: [TypeOrmModule.forFeature([DoSuggestion, DoSuggestionDetail])],
  controllers: [DoSuggestionController],
  providers: [DoSuggestionService, DoSuggestionRepository],
  exports: [DoSuggestionService, DoSuggestionRepository],
})
export class DoSuggestionModule {}
