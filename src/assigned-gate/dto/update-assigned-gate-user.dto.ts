import { PartialType } from '@nestjs/swagger';
import { CreateAssignedGateUserDto } from './create-assigned-gate-user.dto';

export class UpdateAssignedGateUserDto extends PartialType(CreateAssignedGateUserDto) {}

