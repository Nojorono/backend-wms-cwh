import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateBtbDetailDto } from './create-btb-detail.dto';

export class CreateBtbDto {
  @ApiProperty({ example: 'BTB-2026-0001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  btb_number: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  btb_date?: string;

  @ApiPropertyOptional({ example: 'SUB' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  organization_code?: string;

  @ApiPropertyOptional({ description: 'Organization (m_io) ID' })
  @IsOptional()
  @IsUUID()
  organization_id?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sales_nik?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sales_name?: string;

  @ApiPropertyOptional({ example: '87654321' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sales_spv_nik?: string;

  @ApiPropertyOptional({ example: 'Supervisor Name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sales_spv_name?: string;

  @ApiPropertyOptional({ example: 'DRAFT' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @ApiPropertyOptional({ example: '020000149' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  created_by?: string;

  @ApiPropertyOptional({ example: '020000149' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  updated_by?: string;

  @ApiPropertyOptional({ type: [CreateBtbDetailDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBtbDetailDto)
  details?: CreateBtbDetailDto[];
}
