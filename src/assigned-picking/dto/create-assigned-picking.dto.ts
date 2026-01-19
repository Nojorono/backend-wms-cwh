import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsPhoneNumber } from 'class-validator';

export class CreateAssignedPickingDto {
  @ApiProperty({ description: 'ID outbound memo' })
  @IsNotEmpty()
  @IsString()
  memo_id: string;

  @ApiProperty({ description: 'ID user yang ditugaskan untuk picking' })
  @IsNotEmpty()
  @IsString()
  picking_user_id: string;

  @ApiProperty({ description: 'Nama user yang ditugaskan untuk picking' })
  @IsNotEmpty()
  @IsString()
  picking_name: string;

  @ApiProperty({ description: 'Nomor telepon user yang ditugaskan', required: false })
  @IsOptional()
  @IsString()
  picking_phone?: string;
}
