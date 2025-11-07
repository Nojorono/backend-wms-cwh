import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerMainDto {
  @ApiProperty({ example: 1, description: 'Business group ID' })
  @IsNumber()
  businessGroupId: number;

  @ApiProperty({ example: '2024-01-01', description: 'Valid from date' })
  @IsDateString()
  dateFrom: string;

  @ApiProperty({ example: '2024-12-31', description: 'Valid to date' })
  @IsDateString()
  dateTo: string;

  @ApiProperty({ example: '123', description: 'Default legal context ID' })
  @IsString()
  defaultLegalContextId: string;

  @ApiProperty({ example: 'LOC001', description: 'Location code' })
  @IsString()
  locationCode: string;

  @ApiProperty({ example: 'Main Warehouse', description: 'Location description' })
  @IsString()
  locationDescription: string;

  @ApiProperty({ example: 'PT Example', description: 'Organization name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ORG001', description: 'Organization code' })
  @IsString()
  orgCode: string;

  @ApiProperty({ example: 82, description: 'Organization ID' })
  @IsNumber()
  orgId: number;

  @ApiProperty({ example: '456', description: 'Set of books ID' })
  @IsString()
  setOfBooksId: string;

  @ApiProperty({ example: 'SC01', description: 'Short code' })
  @IsString()
  shortCode: string;

  @ApiProperty({ example: true, description: 'Usable flag', required: false })
  @IsBoolean()
  @IsOptional()
  usableFlag?: boolean;
}

