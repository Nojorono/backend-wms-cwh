import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PalletUpdate } from './pallet-update.entity';
import { User } from './user.entity';

@Entity('pallet_update_assigned')
export class PalletUpdateAssigned extends BaseEntity {
    @Column({ name: 'palletUpdateId', nullable: false })
    palletUpdateId: string;

    @ManyToOne(() => PalletUpdate, (update) => update.assigned, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'palletUpdateId' })
    palletUpdate: PalletUpdate;

    @Column({ name: 'userId', nullable: false })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ name: 'assignedAt', nullable: false })
    assignedAt: Date;
}
