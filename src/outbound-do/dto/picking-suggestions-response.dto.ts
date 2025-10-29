import { ApiProperty } from '@nestjs/swagger';
import { PickingSuggestionDto } from './picking-suggestion.dto';

export class PickingSuggestionsResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation successful'
  })
  message: string;

  @ApiProperty({
    description: 'Array of picking suggestions for each item',
    type: [PickingSuggestionDto]
  })
  data: PickingSuggestionDto[];

  @ApiProperty({
    description: 'Response timestamp',
    example: '2025-10-28T07:46:21.846Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'API endpoint path',
    example: '/outbound-do/memo/f10e4290-fa5a-4571-9a97-c9eeb7a9fe01/picking-suggestions'
  })
  path: string;
}
