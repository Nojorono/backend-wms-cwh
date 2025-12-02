import { PartialType } from '@nestjs/swagger';
import { CreateAssignedGateDto } from './create-assigned-gate.dto';

export class UpdateAssignedGateDto extends PartialType(CreateAssignedGateDto) {}

