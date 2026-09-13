import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CallPlanReminderPreviewQueryDto {
  @ApiPropertyOptional({ example: '2026-06-02' })
  @IsOptional()
  @IsDateString()
  callPlanStartDate?: string;

  @ApiPropertyOptional({ example: 'JOG' })
  @IsOptional()
  @IsString()
  cabang?: string;

  @ApiPropertyOptional({ example: 'AHMAD GAHAR HABIBIE' })
  @IsOptional()
  @IsString()
  supervisorName?: string;

  @ApiPropertyOptional({ example: '250416.00028BC' })
  @IsOptional()
  @IsString()
  supervisorNik?: string;

  @ApiPropertyOptional({ example: 'DAVID PALGUNA' })
  @IsOptional()
  @IsString()
  ahomName?: string;

  @ApiPropertyOptional({ example: '250801.00030DA' })
  @IsOptional()
  @IsString()
  ahomNik?: string;
}
