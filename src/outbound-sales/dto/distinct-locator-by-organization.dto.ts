import { ApiPropertyOptional } from '@nestjs/swagger';

export class DistinctLocatorByOrganizationDto {
  @ApiPropertyOptional({ example: 'JAT' })
  organization_code?: string;

  @ApiPropertyOptional({ example: 'JAKARTA TIMUR' })
  organization_name?: string;

  @ApiPropertyOptional({ example: 'KECIL' })
  subinventory_code?: string;

  @ApiPropertyOptional({ example: 1001 })
  locator_id?: number;

  @ApiPropertyOptional({ example: 'KECIL.A1.01' })
  locator?: string;

  @ApiPropertyOptional({ example: 'RACK A1 BIN 01' })
  locator_name?: string;
}
