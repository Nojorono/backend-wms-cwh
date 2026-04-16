import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateMasterWarehouseBinDto } from './create-master-warehouse-bin.dto';

export class UpdateMasterWarehouseBinDto extends PartialType(CreateMasterWarehouseBinDto) {
}
