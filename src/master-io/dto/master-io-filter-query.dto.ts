import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MasterIOFilterQueryDto {
  @ApiPropertyOptional({
    example: 'BRANCH,SUBBRANCH',
    description: 'Comma-separated organization types',
  })
  @IsOptional()
  @IsString()
  organization_type?: string;

  @ApiPropertyOptional({
    example: '204301',
    description: 'Region code. Use the literal string `null` to match IS NULL rows.',
  })
  @IsOptional()
  @IsString()
  region_code?: string;

  @ApiPropertyOptional({
    example: '2026-02-03T17:00:00.000Z',
    description: 'End date active. Use the literal string `null` to match IS NULL rows.',
  })
  @IsOptional()
  @IsString()
  end_date_active?: string;
}

export interface MasterIOFilter {
  organization_types?: string[];
  region_code?: string | null;
  end_date_active?: Date | null;
}
