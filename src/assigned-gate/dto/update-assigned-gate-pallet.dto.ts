import { PartialType } from '@nestjs/swagger';
import { CreateAssignedGatePalletDto } from './create-assigned-gate-pallet.dto';

export class UpdateAssignedGatePalletDto extends PartialType(CreateAssignedGatePalletDto) {}

