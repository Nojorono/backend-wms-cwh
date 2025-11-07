import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';

@Entity('customer_main')
export class CustomerMain extends BaseEntity {
  @ApiProperty({ description: 'Business group ID', example: 1 })
  @Column({ name: 'business_group_id', type: 'int' , nullable: true })
  businessGroupId: number;

  @ApiProperty({ description: 'Valid from date', example: '2024-01-01' })
  @Column({ name: 'date_from', type: 'date' , nullable: true  })
  dateFrom: Date;

  @ApiProperty({ description: 'Valid to date', example: '2024-12-31' })
  @Column({ name: 'date_to', type: 'date' , nullable: true})
  dateTo: Date;

  @ApiProperty({ description: 'Default legal context ID', example: '123' })
  @Column({ name: 'default_legal_context_id', type: 'varchar', length: 100 , nullable: true })
  defaultLegalContextId: string;

  @ApiProperty({ description: 'Location code', example: 'LOC001' })
  @Column({ name: 'location_code', type: 'varchar', length: 50 , nullable: true })
  locationCode: string;

  @ApiProperty({ description: 'Location description', example: 'Main Warehouse' })
  @Column({ name: 'location_description', type: 'varchar', length: 255 , nullable: true })
  locationDescription: string;

  @ApiProperty({ description: 'Organization name', example: 'PT Example' })
  @Column({ name: 'name', type: 'varchar', length: 255 , nullable: true })
  name: string;

  @ApiProperty({ description: 'Organization code', example: 'ORG001' })
  @Column({ name: 'org_code', type: 'varchar', length: 50 , nullable: true })
  orgCode: string;

  @ApiProperty({ description: 'Organization ID', example: 82 })
  @Column({ name: 'org_id', type: 'int' , nullable: true })
  orgId: number;

  @ApiProperty({ description: 'Set of books ID', example: '456' })
  @Column({ name: 'set_of_books_id', type: 'varchar', length: 100 , nullable: true })
  setOfBooksId: string;

  @ApiProperty({ description: 'Short code', example: 'SC01' })
  @Column({ name: 'short_code', type: 'varchar', length: 20 , nullable: true })
  shortCode: string;

  @ApiProperty({ description: 'Usable flag', example: true })
  @Column({ name: 'usable_flag', type: 'boolean', default: true , nullable: true })
  usableFlag: boolean;
}