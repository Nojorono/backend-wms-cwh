import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

export class UpdateSaldoInspectionDto {
    @ApiPropertyOptional({ description: 'Quantity Inspection' })
    @IsOptional()
    @IsNumber()
    quantity_inspection?: number;
  }