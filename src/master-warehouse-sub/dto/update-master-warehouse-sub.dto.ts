import { PartialType } from '@nestjs/swagger';
import { CreateMasterWarehouseSubDto } from './create-master-warehouse-sub.dto';

export class UpdateMasterWarehouseSubDto extends PartialType(CreateMasterWarehouseSubDto) {

}
