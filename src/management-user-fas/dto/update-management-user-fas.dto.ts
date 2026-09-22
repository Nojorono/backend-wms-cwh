import { PartialType } from '@nestjs/swagger';
import { CreateManagementUserFasDto } from './create-management-user-fas.dto';

export class UpdateManagementUserFasDto extends PartialType(CreateManagementUserFasDto) {}
