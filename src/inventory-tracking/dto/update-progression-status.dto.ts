import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ProgressionStatus } from '../../core/domain/entities/inventory-tracking.entity';

export class UpdateProgressionStatusDto {
    @ApiProperty({
        enum: ProgressionStatus,
        example: ProgressionStatus.IN_PROGRESS,
        description: 'Progression status',
    })
    @IsNotEmpty()
    @IsEnum(ProgressionStatus)
    progression_status: ProgressionStatus;
}
