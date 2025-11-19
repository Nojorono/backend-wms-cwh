import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateApprovalSetupDto, CreateApprovalLevelDto } from './create-approval-setup.dto';
import { IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateApprovalLevelDto extends PartialType(CreateApprovalLevelDto) {}

export class UpdateApprovalSetupDto extends OmitType(PartialType(CreateApprovalSetupDto), ['approval_levels'] as const) {
  @ApiPropertyOptional({
    type: () => [UpdateApprovalLevelDto],
    description: 'Array of approval levels to update',
  })
  @IsOptional()
  @IsArray({ message: 'approval_levels must be an array' })
  @ValidateNested({ each: true })
  @Type(() => UpdateApprovalLevelDto)
  approval_levels?: UpdateApprovalLevelDto[];
}

