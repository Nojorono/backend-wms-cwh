import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MetaSalesItemDtoByBranch {
  @ApiProperty({
    description: 'Branch code to filter sales items',
    example: 'ORG001',
  })
  @IsNotEmpty()
  @IsString()
  branch: string;
}
