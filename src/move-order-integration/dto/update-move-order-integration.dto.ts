import { PartialType } from '@nestjs/swagger';
import { CreateMoveOrderIntegrationDto } from './create-move-order-integration.dto';

export class UpdateMoveOrderIntegrationDto extends PartialType(CreateMoveOrderIntegrationDto) {}
