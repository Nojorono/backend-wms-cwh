import { PartialType } from '@nestjs/swagger';
import { CreatePalletUpdateDto } from './create-pallet-update.dto';

export class UpdatePalletUpdateDto extends PartialType(CreatePalletUpdateDto) {}
