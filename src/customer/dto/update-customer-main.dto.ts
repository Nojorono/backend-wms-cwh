import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCustomerMainDto {
  @ApiProperty({ example: 1, description: 'Business group ID', required: false })
  @IsNumber()
  @IsOptional()
  businessGroupId?: number;

  @ApiProperty({ example: '2024-01-01', description: 'Valid from date', required: false })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiProperty({ example: '2024-12-31', description: 'Valid to date', required: false })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiProperty({ example: '123', description: 'Default legal context ID', required: false })
  @IsString()
  @IsOptional()
  defaultLegalContextId?: string;

  @ApiProperty({ example: 'LOC001', description: 'Location code', required: false })
  @IsString()
  @IsOptional()
  locationCode?: string;

  @ApiProperty({ example: 'Main Warehouse', description: 'Location description', required: false })
  @IsString()
  @IsOptional()
  locationDescription?: string;

  @ApiProperty({ example: 'PT Example', description: 'Organization name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'ORG001', description: 'Organization code', required: false })
  @IsString()
  @IsOptional()
  orgCode?: string;

  @ApiProperty({ example: 82, description: 'Organization ID', required: false })
  @IsNumber()
  @IsOptional()
  orgId?: number;

  @ApiProperty({ example: '456', description: 'Set of books ID', required: false })
  @IsString()
  @IsOptional()
  setOfBooksId?: string;

  @ApiProperty({ example: 'SC01', description: 'Short code', required: false })
  @IsString()
  @IsOptional()
  shortCode?: string;

  @ApiProperty({ example: true, description: 'Usable flag', required: false })
  @IsBoolean()
  @IsOptional()
  usableFlag?: boolean;
}

