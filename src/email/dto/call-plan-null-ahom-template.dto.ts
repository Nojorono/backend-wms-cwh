import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CallPlanNullAhomSalesRowDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  salesName: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  salesNik: string;

  @ApiPropertyOptional({ example: 'RT-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  routeNumber?: string;

  @ApiPropertyOptional({ example: '2026-06-19' })
  @IsOptional()
  @IsDateString()
  callPlanStartDate?: string;

  @ApiPropertyOptional({ example: '2026-06-21' })
  @IsOptional()
  @IsDateString()
  callPlanEndDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isLuarkota?: boolean;
}

export class CallPlanNullAhomSupervisorBlockDto {
  @ApiProperty({ example: 'Supervisor Name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  supervisorName: string;

  @ApiProperty({ example: '87654321' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  supervisorNik: string;

  @ApiProperty({ type: [CallPlanNullAhomSalesRowDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CallPlanNullAhomSalesRowDto)
  sales: CallPlanNullAhomSalesRowDto[];
}

export class CallPlanNullAhomTemplateDto {
  @ApiProperty({ example: '2026-06-19' })
  @IsDateString()
  callPlanStartDate: string;

  @ApiProperty({ example: 'KRW' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cabang: string;

  @ApiProperty({ example: 'AHOM Name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  ahomName: string;

  @ApiProperty({ example: '11223344' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  ahomNik: string;

  @ApiProperty({ type: [CallPlanNullAhomSupervisorBlockDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CallPlanNullAhomSupervisorBlockDto)
  supervisors: CallPlanNullAhomSupervisorBlockDto[];

  @ApiPropertyOptional({ example: '19 Jun 2026, 08.00' })
  @IsOptional()
  @IsString()
  generatedAt?: string;
}
