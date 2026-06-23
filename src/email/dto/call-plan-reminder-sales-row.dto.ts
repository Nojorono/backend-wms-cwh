import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CallPlanReminderSalesRowDto {
  @ApiProperty({ example: 'BUDI HARYANTO' })
  @IsString()
  @IsNotEmpty()
  salesName: string;

  @ApiProperty({ example: '090513.00174DA' })
  @IsString()
  @IsNotEmpty()
  salesNik: string;

  @ApiPropertyOptional({ example: '43' })
  @IsOptional()
  @IsString()
  routeNumber?: string;

  @ApiPropertyOptional({ example: '2026-06-02' })
  @IsOptional()
  @IsString()
  callPlanStartDate?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  callPlanEndDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isLuarkota?: boolean;
}
