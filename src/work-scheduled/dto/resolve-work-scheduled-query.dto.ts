import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class ResolveWorkScheduledQueryDto {
  @ApiProperty({ example: '2026-08-17' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({
    description: 'Cabang untuk cek override. Kosongkan untuk hanya default global',
    example: 'b8f8b2f4-2f2e-4c2a-9c2f-8b2f4b8f8b2f',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
