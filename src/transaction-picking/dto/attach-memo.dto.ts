import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, ArrayMinSize } from 'class-validator';

export class AttachMemoDto {
  @ApiProperty({ description: 'Array of transaction picking IDs', type: [String] })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  transactionIds: string[];
}

