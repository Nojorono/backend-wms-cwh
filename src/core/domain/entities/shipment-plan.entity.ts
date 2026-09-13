import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ShipmentPlanItem } from './shipment-plan-item.entity';

@Entity('shipment_plans')
export class ShipmentPlan extends BaseEntity {
    @Column({ name: 'organization_id', nullable: true })
    organizationId: string;

    @Column({ name: 'file_name', length: 255 })
    fileName: string;

    @Column({ name: 'file_size', type: 'int' })
    fileSize: number;

    @Column({ name: 'total_extracted_rows', type: 'int' })
    totalExtractedRows: number;

    @Column({ name: 'week_number', type: 'int' })
    weekNumber: number;

    @Column({ name: 'batch_number', length: 255 })
    batchNumber: string;

    @OneToMany(() => ShipmentPlanItem, (shipmentPlanItem) => shipmentPlanItem.shipmentPlan)
    items: ShipmentPlanItem[];
}
