import { PartialType } from '@nestjs/swagger';
import { CreateAssignedGateLoadDto } from './create-assigned-gate-load.dto';

export class UpdateAssignedGateLoadDto extends PartialType(CreateAssignedGateLoadDto) {}

