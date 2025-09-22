import { ApiProperty } from "@nestjs/swagger";
import { IsArray, ValidateNested, IsString, IsNumber, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class BulkUpdateSaldoInspectionItemDto {
  @ApiProperty({ description: 'Inbound item ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Quantity Inspection' })
  @IsNumber()
  quantity_inspection: number;
}

export class BulkUpdateSaldoInspectionDto {
  @ApiProperty({ 
    description: 'Array of inbound items to update',
    type: [BulkUpdateSaldoInspectionItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateSaldoInspectionItemDto)
  items: BulkUpdateSaldoInspectionItemDto[];
}
