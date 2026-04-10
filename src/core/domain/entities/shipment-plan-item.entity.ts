import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ShipmentPlan } from './shipment-plan.entity';

@Entity('shipment_plan_items')
export class ShipmentPlanItem extends BaseEntity {
    @Column({ name: 'shipment_plan_id', type: 'uuid' })
    shipmentPlanId: string;

    @ManyToOne(() => ShipmentPlan, (shipmentPlan) => shipmentPlan.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'shipment_plan_id' })
    shipmentPlan: ShipmentPlan;

    @Column({ name: 'source', length: 255 })
    source: string;

    @Column({ name: 'type', length: 255 })
    type: string;

    @Column({ name: 'reg', length: 255 })
    reg: string;

    @Column({ name: 'code', length: 255 })
    code: string;

    @Column({ name: 'amo', length: 255 })
    amo: string;

    @Column({ name: 'sku', length: 255 })
    sku: string;

    @Column({ name: 'metric', length: 255 })
    metric: string;

    @Column({ name: 'quantity', type: 'int' })
    quantity: number;

    @Column({ name: 'uom', length: 255 })
    uom: string;
}
