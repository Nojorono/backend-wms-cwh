import { PartialType } from '@nestjs/swagger';
import { CreateCheckerScanningDto } from './create-checker-scanning.dto';

export class UpdateCheckerScanningDto extends PartialType(CreateCheckerScanningDto) {} 