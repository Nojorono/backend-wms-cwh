import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export const DO_SUGGESTION_MO_TYPE_VALUES = ['FPPR Awal', 'FPPR Tambahan'] as const;
export type DoSuggestionMoType = (typeof DO_SUGGESTION_MO_TYPE_VALUES)[number];

export class CreateDummyDataDoSuggestionQueryDto {
  @ApiProperty({
    example: 'FPPR Awal',
    enum: DO_SUGGESTION_MO_TYPE_VALUES,
    description: 'Move order type for dummy DO suggestion data',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn([...DO_SUGGESTION_MO_TYPE_VALUES])
  mo_type: DoSuggestionMoType;
}
