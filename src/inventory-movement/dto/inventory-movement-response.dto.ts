import { ApiProperty } from '@nestjs/swagger';
import { InventoryMovement } from '../../core/domain/entities/inventory-movement.entity';
import { PaginatedResponseDto, PaginationMetaDto } from '../../core/dto/pagination.dto';

export class InventoryMovementListResponseDto {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Data inventory movement berhasil diambil' })
    message: string;

    @ApiProperty({ type: [InventoryMovement] })
    data: InventoryMovement[];
}

export class InventoryMovementPaginatedResponseDto {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Operation successful' })
    message: string;

    @ApiProperty({ type: [InventoryMovement] })
    data: InventoryMovement[];

    @ApiProperty({ type: PaginationMetaDto })
    meta: PaginationMetaDto;
}

export class InventoryMovementDetailResponseDto {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Detail inventory movement berhasil diambil' })
    message: string;

    @ApiProperty({ type: InventoryMovement })
    data: InventoryMovement;
}

export class InventoryMovementCreateResponseDto {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Inventory movement created successfully' })
    message: string;

    @ApiProperty({ type: InventoryMovement })
    data: InventoryMovement;
}

export class InventoryMovementUpdateResponseDto {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Inventory movement updated successfully' })
    message: string;

    @ApiProperty({ type: InventoryMovement })
    data: InventoryMovement;
}

export class InventoryMovementDeleteResponseDto {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Inventory movement berhasil dihapus' })
    message: string;
}
