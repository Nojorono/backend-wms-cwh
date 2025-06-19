import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Permission } from './permission.entity';

@Entity('menus')
@Index(['path'], { unique: true })
@Index(['parentId'])
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 200 })
  path: string;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  icon: string | null;

  @Column({ name: 'parent_id', nullable: true, type: 'int' })
  parentId: number | null;

  @ManyToOne(() => Menu, menu => menu.children, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: Menu | null;

  @OneToMany(() => Menu, menu => menu.parent, { cascade: true })
  children: Menu[];

  @Column({ default: 0 })
  order: number;

  @OneToMany(() => Permission, permission => permission.menu, { cascade: true })
  permissions: Permission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
