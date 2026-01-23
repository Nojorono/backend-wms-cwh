import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class MovePalletDto {
    @ApiProperty({
        description: 'ID inventory movement',
        type: String,
        example: 'uuid-inventory-movement-1',
    })
    @IsNotEmpty()
    @IsString()
    inventory_movement_id: string;

    @ApiProperty({
        description: 'ID pallet',
        type: String,
        example: 'uuid-pallet-1',
    })
    @IsNotEmpty()
    @IsString()
    pallet_id: string;

    @ApiProperty({
        description: 'ID inventory tracking',
        type: String,
        example: 'uuid-inventory-tracking-1',
    })
    @IsNotEmpty()
    @IsString()
    inventory_tracking_id: string;

    @ApiProperty({
        description: 'ID warehouse tujuan',
        type: String,
        example: 'uuid-warehouse-1',
    })
    @IsNotEmpty()
    @IsString()
    destination_warehouse_id: string;

    @ApiProperty({
        description: 'ID warehouse sub tujuan',
        type: String,
        example: 'uuid-warehouse-sub-1',
    })
    @IsNotEmpty()
    @IsString()
    destination_warehouse_sub_id: string;

    @ApiProperty({
        description: 'ID bin tujuan',
        type: String,
        example: 'uuid-bin-1',
    })
    @IsNotEmpty()
    @IsString()
    destination_bin_id: string;
}