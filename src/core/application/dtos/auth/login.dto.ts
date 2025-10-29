import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'superadmin',
    description: 'The username of the user to login',
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'admin123',
    description: 'The password of the user to login',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
