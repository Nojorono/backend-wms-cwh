import { PartialType } from '@nestjs/swagger';
import { CreateMoveOrderIntegrationLineDto } from './create-move-order-integration-line.dto';

export class UpdateMoveOrderIntegrationLineDto extends PartialType(CreateMoveOrderIntegrationLineDto) {}
