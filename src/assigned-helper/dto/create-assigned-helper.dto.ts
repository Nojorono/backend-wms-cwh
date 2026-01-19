import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateAssignedHelperDto {
  @ApiProperty({
    description: 'Inbound ID',
    example: 'uuid-inbound-123',
  })
  @IsString()
  inbound_id: string;

  @ApiPropertyOptional({
    description: 'Helper user ID',
    example: 'uuid-user-123',
  })
  @IsOptional()
  @IsString()
  helper_user_id?: string;

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
