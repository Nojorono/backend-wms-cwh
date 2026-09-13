import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateOrUpdateDoSuggestionDto } from './create-or-update-do-suggestion.dto';

export const DO_SUGGESTION_BATCH_MAX_SIZE = 50;

export class BatchCreateOrUpdateDoSuggestionDto {
  @ApiProperty({
    type: [CreateOrUpdateDoSuggestionDto],
    description: `Array of DO suggestions to create or update (max ${DO_SUGGESTION_BATCH_MAX_SIZE} per request)`,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(DO_SUGGESTION_BATCH_MAX_SIZE)
  @ValidateNested({ each: true })
  @Type(() => CreateOrUpdateDoSuggestionDto)
  data: CreateOrUpdateDoSuggestionDto[];
}
