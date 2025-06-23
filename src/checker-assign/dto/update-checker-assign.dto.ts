import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CheckerUser } from './create-checker-assign.dto';

export class UpdateCheckerAssignDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  inbound_plan_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  checker_leader_id?: string;

  @ApiProperty({ required: false, type: [CheckerUser] })
  @IsOptional()
  @IsArray()
  checkers?: CheckerUser[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  assign_date_start?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  assign_date_finish?: Date;
}