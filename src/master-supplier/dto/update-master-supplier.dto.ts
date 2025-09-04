import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMasterSupplierDto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  organization_id?: number;

  @ApiProperty({ example: 'Operating Unit', required: false })
  @IsString()
  @IsOptional()
  operating_unit?: string;

  @ApiProperty({ example: 'SUP001', required: false })
  @IsString()
  @IsOptional()
  supplier_code?: string;

  @ApiProperty({ example: 'Supplier Name', required: false })
  @IsString()
  @IsOptional()
  supplier_name?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsString()
  @IsOptional()
  supplier_address?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  supplier_contact_person?: string;

  @ApiProperty({ example: '123-456-7890', required: false })
  @IsString()
  @IsOptional()
  supplier_phone?: string;

  @ApiProperty({ example: 'supplier@email.com', required: false })
  @IsString()
  @IsOptional()
  supplier_email?: string;
}
