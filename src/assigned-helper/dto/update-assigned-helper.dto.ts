import { PartialType } from '@nestjs/swagger';
import { CreateAssignedHelperDto } from './create-assigned-helper.dto';

export class UpdateAssignedHelperDto extends PartialType(CreateAssignedHelperDto) {}
