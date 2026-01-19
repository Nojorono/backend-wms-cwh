import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { BasePaginationQueryDto } from '../dto/base-pagination.dto';

export interface PaginationFieldConfig {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  example: any;
  required?: boolean;
}

export function createPaginationDto(fields: PaginationFieldConfig[]) {
  class DynamicPaginationDto extends BasePaginationQueryDto {}

  fields.forEach((field) => {
    const decorators = [
      ApiPropertyOptional({
        description: field.description,
        example: field.example,
      }),
      IsOptional(),
    ];

    if (field.type === 'string') {
      decorators.push(IsString());
    } else if (field.type === 'number') {
      decorators.push(
        Type(() => Number),
        IsNumber(),
      );
    } else if (field.type === 'boolean') {
      decorators.push(
        Type(() => Boolean),
        IsBoolean(),
      );
    }

    if (field.required) {
      decorators.splice(decorators.indexOf(IsOptional()), 1);
    }

    Object.defineProperty(DynamicPaginationDto.prototype, field.name, {
      value: undefined,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    // Apply decorators to the property
    decorators.forEach((decorator) => {
      decorator(DynamicPaginationDto.prototype, field.name);
    });
  });

  return DynamicPaginationDto;
}

// Example usage:
export const InboundPaginationDto = createPaginationDto([
  {
    name: 'status',
    type: 'string',
    description: 'Filter inbounds by status',
    example: 'CREATED',
  },
  {
    name: 'expedition',
    type: 'string',
    description: 'Filter inbounds by expedition',
    example: 'Carrier A',
  },
  {
    name: 'origin',
    type: 'string',
    description: 'Filter inbounds by origin',
    example: 'Factory 1',
  },
  {
    name: 'inbound_type',
    type: 'string',
    description: 'Filter inbounds by inbound type',
    example: 'PO',
  },
  {
    name: 'driver_name',
    type: 'string',
    description: 'Filter inbounds by driver name',
    example: 'John Doe',
  },
  {
    name: 'license_plate',
    type: 'string',
    description: 'Filter inbounds by license plate',
    example: 'B 1234 XYZ',
  },
]);
