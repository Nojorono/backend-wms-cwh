import { PartialType } from '@nestjs/swagger';
import { CreateOnHandAtrDto } from './create-on-hand-atr.dto';

export class UpdateOnHandAtrDto extends PartialType(CreateOnHandAtrDto) {}
