import { PartialType } from '@nestjs/swagger';
import { CreateAssignedGateHelperDto } from './create-assigned-gate-helper.dto';

export class UpdateAssignedGateHelperDto extends PartialType(CreateAssignedGateHelperDto) {}

