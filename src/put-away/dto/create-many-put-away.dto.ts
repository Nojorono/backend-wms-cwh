import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePutAwayDto } from './create-put-away.dto';

export class CreateManyPutAwayDto {
  @ApiProperty({
    type: [CreatePutAwayDto],
    description: 'Array of put away data to create',
    example: [
      {
        organization_id: 'uuid-organization-1',
        inventory_tracking_id: 'uuid-inventory-1',
        destination_bin_id: 'uuid-bin-1',
        forklift_driver_id: 'uuid-driver-1',
        driver_name: 'John Doe',
        driver_phone: '081234567890',
        status: 'PENDING',
        notes: 'Put away item 1',
        uom: 'PCS',
        quantity: 10,
        week_number: 1,
        production_date: '2025-01-01',
        inbound_id: 'uuid-inbound-1',
      },
      {
        inventory_tracking_id: 'uuid-inventory-2',
        destination_bin_id: 'uuid-bin-2',
        forklift_driver_id: 'uuid-driver-2',
        driver_name: 'Jane Smith',
        driver_phone: '081234567891',
        status: 'PENDING',
        notes: 'Put away item 2',
        uom: 'PCS',
        quantity: 10,
        week_number: 1,
        production_date: '2025-01-01',
        inbound_id: 'uuid-inbound-2',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePutAwayDto)
  data: CreatePutAwayDto[];
}
