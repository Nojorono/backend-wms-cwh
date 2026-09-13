import { PartialType } from '@nestjs/swagger';
import { CreateMasterIODto } from './create-master-io.dto';

export class UpdateMasterIODto extends PartialType(CreateMasterIODto) {
}
