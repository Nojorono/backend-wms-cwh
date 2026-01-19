import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserManageDto {
  @ApiProperty({ 
    example: 'John Doe', 
    description: 'Full name of the user',
    maxLength: 255 
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ 
    example: '+1234567890', 
    description: 'Phone number of the user',
    maxLength: 255 
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  phone: string;

  @ApiProperty({ 
    example: 'Administrator', 
    description: 'Role name assigned to the user',
    maxLength: 255 
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  roleName: string;
}
