import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';

@Entity('customer_subdist')
export class CustomerSubdist extends BaseEntity {
  @ApiProperty({ description: 'Customer account ID', example: 13975 })
  @Column({ name: 'cust_account_id', type: 'int' , nullable: true })
  custAccountId: number;

  @ApiProperty({ description: 'Customer name', example: 'UD. PIALA MAS JAYA' })
  @Column({ name: 'customer_name', type: 'varchar', length: 255 , nullable: true })
  customerName: string;

  @ApiProperty({ description: 'Customer number', example: '11935' })
  @Column({ name: 'customer_number', type: 'varchar', length: 50 , nullable: true })
  customerNumber: string;

  @ApiProperty({ description: 'Customer address', example: 'Jl.Diponegoro RT22 no.18,Tarakan,Kal-Tim' })
  @Column({ name: 'address1', type: 'text', nullable: true })
  address1: string;

  @ApiProperty({ description: 'Province', example: 'KALIMANTAN UTARA' })
  @Column({ name: 'provinsi', type: 'varchar', length: 100, nullable: true })
  provinsi: string;

  @ApiProperty({ description: 'Regency/City', example: 'TARAKAN' })
  @Column({ name: 'kab_kodya', type: 'varchar', length: 100, nullable: true })
  kabKodya: string;

  @ApiProperty({ description: 'District', example: 'TARAKAN TENGAH' })
  @Column({ name: 'kecamatan', type: 'varchar', length: 100, nullable: true })
  kecamatan: string;

  @ApiProperty({ description: 'Village', example: null, required: false })
  @Column({ name: 'kelurahan', type: 'varchar', length: 100, nullable: true })
  kelurahan: string;

  @ApiProperty({ description: 'Organization ID', example: 82 })
  @Column({ name: 'org_id', type: 'int' , nullable: true })
  orgId: number;

  @ApiProperty({ description: 'Distribution channel', example: 'SD' })
  @Column({ name: 'channel', type: 'varchar', length: 10, nullable: true })
  channel: string;

  @ApiProperty({ description: 'Customer status', example: 'ACTIVE' })
  @Column({ name: 'status', type: 'varchar', length: 20, nullable: true })
  status: string;

  @ApiProperty({ description: 'Site type', example: null, required: false })
  @Column({ name: 'site_type', type: 'varchar', length: 50, nullable: true })
  siteType: string;

  @ApiProperty({ description: 'Bill to location', example: 'TARAKAN - PIALA MAS JAYA' })
  @Column({ name: 'bill_to_location', type: 'varchar', length: 255, nullable: true })
  billToLocation: string;

  @ApiProperty({ description: 'Bill to site use ID', example: 30612 })
  @Column({ name: 'bill_to_site_use_id', type: 'int', nullable: true })
  billToSiteUseId: number;

  @ApiProperty({ description: 'Ship to location', example: 'NUNUKAN - PIALA MAS JAYA' })
  @Column({ name: 'ship_to_location', type: 'varchar', length: 255, nullable: true })
  shipToLocation: string;

  @ApiProperty({ description: 'Ship to site use ID', example: 30616 })
  @Column({ name: 'ship_to_site_use_id', type: 'int', nullable: true })
  shipToSiteUseId: number;

  @ApiProperty({ description: 'Credit checking flag', example: 'Y' })
  @Column({ name: 'credit_checking', type: 'varchar', length: 1, nullable: true })
  creditChecking: string;

  @ApiProperty({ description: 'Overall credit limit', example: 3200000000 })
  @Column({ name: 'overall_credit_limit', type: 'bigint', nullable: true })
  overallCreditLimit: number;

  @ApiProperty({ description: 'Transaction credit limit', example: 3200000000 })
  @Column({ name: 'trx_credit_limit', type: 'bigint', nullable: true })
  trxCreditLimit: number;

  @ApiProperty({ description: 'Payment term ID', example: 2004 })
  @Column({ name: 'term_id', type: 'int', nullable: true })
  termId: number;

  @ApiProperty({ description: 'Payment term name', example: '21 Hari' })
  @Column({ name: 'term_name', type: 'varchar', length: 100, nullable: true })
  termName: string;

  @ApiProperty({ description: 'Payment term days', example: 21 })
  @Column({ name: 'term_day', type: 'int', nullable: true })
  termDay: number;

  @ApiProperty({ description: 'Price list ID', example: 7011 })
  @Column({ name: 'price_list_id', type: 'int', nullable: true })
  priceListId: number;

  @ApiProperty({ description: 'Price list name', example: 'PL - WS / NKA' })
  @Column({ name: 'price_list_name', type: 'varchar', length: 255, nullable: true })
  priceListName: string;

  @ApiProperty({ description: 'Order type ID', example: null, required: false })
  @Column({ name: 'order_type_id', type: 'int', nullable: true })
  orderTypeId: number;

  @ApiProperty({ description: 'Order type name', example: null, required: false })
  @Column({ name: 'order_type_name', type: 'varchar', length: 100, nullable: true })
  orderTypeName: string;

  @ApiProperty({ description: 'Return order type ID', example: null, required: false })
  @Column({ name: 'return_order_type_id', type: 'int', nullable: true })
  returnOrderTypeId: number;

  @ApiProperty({ description: 'Return order type name', example: null, required: false })
  @Column({ name: 'return_order_type_name', type: 'varchar', length: 100, nullable: true })
  returnOrderTypeName: string;

  @ApiProperty({ description: 'Last update date from source system', example: '2024-06-01 19:12:27' })
  @Column({ name: 'last_update_date', type: 'timestamp', nullable: true })
  lastUpdateDate: Date;
}
