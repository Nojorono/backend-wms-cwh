import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AssignedGateStatus } from '../../core/domain/entities/assigned-gate.entity';

export class UpdateAssignedGateStatusDto {
  @ApiProperty({
    description: 'Status of the assigned gate',
    enum: AssignedGateStatus,
    example: AssignedGateStatus.DONE,
  })
  @IsEnum(AssignedGateStatus)
  status: AssignedGateStatus;
}

