import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EntityType } from '../../core/domain/entities/approval.entity';

export class CreateApprovalLevelDto {
  @ApiProperty({ example: 1, description: 'Level number (1, 2, 3, etc.)' })
  @IsInt({ message: 'level must be an integer' })
  @Min(1, { message: 'level must be at least 1' })
  level: number;

  @ApiProperty({ example: 'Supervisor Approval', description: 'Name of the approval level' })
  @IsString({ message: 'level_name must be a string' })
  @IsNotEmpty({ message: 'level_name is required' })
  level_name: string;

  @ApiPropertyOptional({ example: 'First level supervisor approval', description: 'Description of the level' })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @ApiProperty({ example: 1, description: 'Role ID that can approve at this level' })
  @IsInt({ message: 'role_id must be an integer' })
  role_id: number;

  @ApiPropertyOptional({ example: true, description: 'Whether this level is required', default: true })
  @IsOptional()
  @IsBoolean({ message: 'is_required must be a boolean' })
  is_required?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Whether this level can be skipped', default: false })
  @IsOptional()
  @IsBoolean({ message: 'can_skip must be a boolean' })
  can_skip?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Minimum number of approvers required', default: 1 })
  @IsOptional()
  @IsInt({ message: 'min_approvers must be an integer' })
  @Min(1, { message: 'min_approvers must be at least 1' })
  min_approvers?: number;

  @ApiPropertyOptional({ example: 1, description: 'Maximum number of approvers allowed' })
  @IsOptional()
  @IsInt({ message: 'max_approvers must be an integer' })
  @Min(1, { message: 'max_approvers must be at least 1' })
  max_approvers?: number;

  @ApiPropertyOptional({ example: 1, description: 'Required number of approvers at this level', default: 1 })
  @IsOptional()
  @IsInt({ message: 'required_approvers must be an integer' })
  @Min(1, { message: 'required_approvers must be at least 1' })
  required_approvers?: number;

  @ApiPropertyOptional({ example: 0, description: 'Order/sequence of this level', default: 0 })
  @IsOptional()
  @IsInt({ message: 'order must be an integer' })
  order?: number;
}

export class CreateApprovalSetupDto {
  @ApiProperty({ example: 'Stock Adjustment Approval', description: 'Name of the approval setup' })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @ApiPropertyOptional({ example: 'Approval workflow for stock adjustments', description: 'Description' })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @ApiProperty({
    enum: EntityType,
    example: EntityType.STOCK_ADJUSTMENT,
    description: 'Type of entity this approval setup applies to',
  })
  @IsEnum(EntityType, { message: 'entity_type must be a valid EntityType' })
  entity_type: EntityType;

  @ApiPropertyOptional({ example: true, description: 'Whether this setup is active', default: true })
  @IsOptional()
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether all levels must be approved (true) or any level can approve (false)',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'require_all_levels must be a boolean' })
  require_all_levels?: boolean;

  @ApiProperty({
    type: () => [CreateApprovalLevelDto],
    description: 'Array of approval levels in the hierarchy',
  })
  @IsArray({ message: 'approval_levels must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateApprovalLevelDto)
  approval_levels: CreateApprovalLevelDto[];
}

