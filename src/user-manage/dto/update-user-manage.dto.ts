import { PartialType } from '@nestjs/swagger';
import { CreateUserManageDto } from './create-user-manage.dto';

export class UpdateUserManageDto extends PartialType(CreateUserManageDto) {}
