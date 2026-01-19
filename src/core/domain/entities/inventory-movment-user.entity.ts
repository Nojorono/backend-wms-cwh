import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { InventoryMovement } from './inventory-movement.entity';
import { User } from './user.entity';

@Entity('inventory_movement_users')
export class InventoryMovementUser extends BaseEntity {

  @Column({ nullable: true })
  inventory_movement_id: string;

  @ManyToOne(() => InventoryMovement, (movement) => movement.id)
  @JoinColumn({ name: 'inventory_movement_id' })
  inventoryMovement: InventoryMovement;

  @Column({ nullable: true })
  user_id: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  user_name: string;

  @Column({ nullable: true })
  user_phone: string;
}

