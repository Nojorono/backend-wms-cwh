import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateManagementUserFasDto {
  @ApiPropertyOptional({
    description: 'Organization (m_io) UUID',
    example: '2047a6c0-14d7-4475-89cb-0f6b9282578e',
  })
  @IsOptional()
  @IsUUID()
  organization_id?: string;

  @ApiProperty({ example: 'fas.admin', description: 'Name (stored in name column)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'fas.admin@nna-id.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;
}
