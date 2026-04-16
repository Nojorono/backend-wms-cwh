import { PartialType } from '@nestjs/swagger';
import { CreateMasterWarehouseDto } from './create-master-warehouse.dto';

export class UpdateMasterWarehouseDto extends PartialType(CreateMasterWarehouseDto) {
}
