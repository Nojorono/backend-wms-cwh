import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAssignedGateUserDto } from './create-assigned-gate-user.dto';
import { CreateAssignedGatePalletDto } from './create-assigned-gate-pallet.dto';

export class CreateAssignedGateDto {
  @ApiPropertyOptional({
    description: 'Assigned Gate ID (required for update, optional for create)',
    example: 'uuid-assigned-gate-123',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Gate name',
    example: 'Gate A',
  })
  @IsString()
  gate_name: string;

  @ApiProperty({
    description: 'Outbound DO ID',
    example: 'uuid-outbound-do-123',
  })
  @IsString()
  outbound_do_id: string;

  @ApiPropertyOptional({
    description: 'Assigned gate users',
    type: [CreateAssignedGateUserDto],
    example: [
      {
        user_id: 'uuid-user-123',
        user_name: 'John Doe',
        user_phone: '+6281234567890',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssignedGateUserDto)
  users?: CreateAssignedGateUserDto[];

  @ApiPropertyOptional({
    description: 'Assigned gate pallets',
    type: [CreateAssignedGatePalletDto],
    example: [
      {
        pallet_id: 'uuid-pallet-123',
        status: 'ASSIGNED',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssignedGatePalletDto)
  pallets?: CreateAssignedGatePalletDto[];
}

