import { PartialType } from '@nestjs/swagger';
import { CreateAssignedPickingDto } from './create-assigned-picking.dto';

export class UpdateAssignedPickingDto extends PartialType(CreateAssignedPickingDto) {}
