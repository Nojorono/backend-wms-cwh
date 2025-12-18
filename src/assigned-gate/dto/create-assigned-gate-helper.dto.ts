import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, ValidateIf } from 'class-validator';

export class CreateAssignedGateHelperDto {
  @ApiPropertyOptional({
    description: 'Assigned Gate Helper ID (required for update, optional for create)',
    example: 'uuid-assigned-gate-helper-123',
  })
  @IsOptional()
  @ValidateIf((o) => o.id !== undefined && o.id !== null)
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: 'Assigned Gate ID (required for standalone helper creation, auto-set when nested in gate helpers array)',
    example: 'uuid-assigned-gate-123',
  })
  @IsOptional()
  @ValidateIf((o, value) => value !== undefined && value !== null && value !== '')
  @IsString()
  assigned_gate_id?: string;

  @ApiProperty({
    description: 'Helper name',
    example: 'John Doe',
  })
  @IsString()
  helper_name: string;

  @ApiProperty({
    description: 'Helper phone number',
    example: '+6281234567890',
  })
  @IsString()
  helper_phone: string;
}

