import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, ValidateIf } from 'class-validator';

export class CreateAssignedGateUserDto {
  @ApiPropertyOptional({
    description: 'Assigned Gate User ID (required for update, optional for create)',
    example: 'uuid-assigned-gate-user-123',
  })
  @IsOptional()
  @ValidateIf((o) => o.id !== undefined && o.id !== null)
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: 'Assigned Gate ID (required for standalone user creation, auto-set when nested in gate users array)',
    example: 'uuid-assigned-gate-123',
  })
  @IsOptional()
  @ValidateIf((o, value) => value !== undefined && value !== null && value !== '')
  @IsString()
  assigned_gate_id?: string;

  @ApiPropertyOptional({
    description: 'User ID',
    example: 'uuid-user-123',
  })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  @IsString()
  user_name: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+6281234567890',
  })
  @IsString()
  user_phone: string;
}

