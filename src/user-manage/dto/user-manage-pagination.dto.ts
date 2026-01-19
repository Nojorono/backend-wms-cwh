import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UserManagePaginationDto {
  @ApiProperty({ 
    example: 'John', 
    description: 'Search term for name, phone, or role name',
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    example: 1, 
    description: 'Page number',
    minimum: 1,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    example: 10, 
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ 
    example: 'created_at', 
    description: 'Field to sort by',
    required: false 
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @ApiProperty({ 
    example: 'desc', 
    description: 'Sort order',
    enum: ['asc', 'desc'],
    required: false 
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
