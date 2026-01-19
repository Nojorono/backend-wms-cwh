import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';
import { Status } from '../../core/domain/entities/transaction-put-away.entity';

export class PutAwayPaginationDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter put away berdasarkan status',
    enum: Status,
    example: Status.PENDING,
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan forklift driver ID',
    example: 'uuid-driver-1',
  })
  @IsOptional()
  @IsString()
  forklift_driver_id?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan nama driver',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  driver_name?: string;
}


