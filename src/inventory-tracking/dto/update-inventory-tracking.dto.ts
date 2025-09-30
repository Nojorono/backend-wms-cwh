import { PartialType } from '@nestjs/swagger';
import { CreateInventoryTrackingDto } from './create-inventory-tracking.dto';

export class UpdateInventoryTrackingDto extends PartialType(CreateInventoryTrackingDto) {}


