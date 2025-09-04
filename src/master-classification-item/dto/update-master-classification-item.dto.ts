import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMasterClassificationItemDto {
  @ApiProperty({ example: 'Classification Name', required: false })
  @IsString()
  @IsOptional()
  classification_name?: string;

  @ApiProperty({ example: 'Classification Code', required: false })
  @IsString()
  @IsOptional()
  classification_code?: string;

  @ApiProperty({ example: 'Classification Description', required: false })
  @IsString()
  @IsOptional()
  classification_description?: string;
}
