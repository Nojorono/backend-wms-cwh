import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DoSuggestion } from './do-suggestion.entity';

@Entity('do_suggestion_details')
export class DoSuggestionDetail extends BaseEntity {
  @Column({ name: 'do_suggestion_uuid', type: 'uuid', nullable: true })
  do_suggestion_uuid: string;

  @ManyToOne(() => DoSuggestion, (doSuggestion) => doSuggestion.details, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'do_suggestion_uuid' })
  do_suggestion: DoSuggestion;

  @Column({ name: 'item_code', type: 'varchar', length: 100, nullable: true })
  item_code: string;

  @Column({ name: 'inventory_item_id', type: 'bigint', nullable: true })
  inventory_item_id: number;

  @Column({ name: 'item_qty_suggestion', type: 'bigint', nullable: true })
  item_qty_suggestion: number;

  @Column({ name: 'item_qty_revision', type: 'bigint', nullable: true })
  item_qty_revision: number;

  @Column({ name: 'item_qty_submitted', type: 'bigint', nullable: true })
  item_qty_submitted: number;

  @Column({ name: 'item_qty_final', type: 'bigint', nullable: true })
  item_qty_final: number;

  @Column({ name: 'contribution_percentage', type: 'numeric', precision: 18, scale: 4, nullable: true })
  contribution_percentage: number;

  @Column({ name: 'item_uom', type: 'varchar', length: 50, nullable: true })
  item_uom: string;

  @Column({ name: 'line_number', type: 'int', nullable: true })
  line_number: number;
}
