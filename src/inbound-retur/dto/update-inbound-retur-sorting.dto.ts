import { PartialType } from '@nestjs/swagger';
import { CreateInboundReturSortingDto } from './create-inbound-retur-sorting.dto';

export class UpdateInboundReturSortingDto extends PartialType(CreateInboundReturSortingDto) {}
