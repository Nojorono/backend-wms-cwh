import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class PermissionDto {
  @ApiProperty({ description: 'ID of the menu' })
  @IsNotEmpty()
  @IsNumber()
  menu_id: number;

  @ApiProperty({
    description: 'Type of permission (View, Create, Update, Delete)',
  })
  @IsNotEmpty()
  @IsString()
  action: string;
}
