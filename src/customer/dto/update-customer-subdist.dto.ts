import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCustomerSubdistDto {
  @ApiProperty({ example: 13975, description: 'Customer account ID', required: false })
  @IsNumber()
  @IsOptional()
  custAccountId?: number;

  @ApiProperty({ example: 'UD. PIALA MAS JAYA', description: 'Customer name', required: false })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiProperty({ example: '11935', description: 'Customer number', required: false })
  @IsString()
  @IsOptional()
  customerNumber?: string;

  @ApiProperty({ example: 'Jl.Diponegoro RT22 no.18,Tarakan,Kal-Tim', description: 'Customer address', required: false })
  @IsString()
  @IsOptional()
  address1?: string;

  @ApiProperty({ example: 'KALIMANTAN UTARA', description: 'Province', required: false })
  @IsString()
  @IsOptional()
  provinsi?: string;

  @ApiProperty({ example: 'TARAKAN', description: 'Regency/City', required: false })
  @IsString()
  @IsOptional()
  kabKodya?: string;

  @ApiProperty({ example: 'TARAKAN TENGAH', description: 'District', required: false })
  @IsString()
  @IsOptional()
  kecamatan?: string;

  @ApiProperty({ example: 'Kelurahan Name', description: 'Village', required: false })
  @IsString()
  @IsOptional()
  kelurahan?: string;

  @ApiProperty({ example: 82, description: 'Organization ID', required: false })
  @IsNumber()
  @IsOptional()
  orgId?: number;

  @ApiProperty({ example: 'SD', description: 'Distribution channel', required: false })
  @IsString()
  @IsOptional()
  channel?: string;

  @ApiProperty({ example: 'ACTIVE', description: 'Customer status', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'TYPE1', description: 'Site type', required: false })
  @IsString()
  @IsOptional()
  siteType?: string;

  @ApiProperty({ example: 'TARAKAN - PIALA MAS JAYA', description: 'Bill to location', required: false })
  @IsString()
  @IsOptional()
  billToLocation?: string;

  @ApiProperty({ example: 30612, description: 'Bill to site use ID', required: false })
  @IsNumber()
  @IsOptional()
  billToSiteUseId?: number;

  @ApiProperty({ example: 'NUNUKAN - PIALA MAS JAYA', description: 'Ship to location', required: false })
  @IsString()
  @IsOptional()
  shipToLocation?: string;

  @ApiProperty({ example: 30616, description: 'Ship to site use ID', required: false })
  @IsNumber()
  @IsOptional()
  shipToSiteUseId?: number;

  @ApiProperty({ example: 'Y', description: 'Credit checking flag', required: false })
  @IsString()
  @IsOptional()
  creditChecking?: string;

  @ApiProperty({ example: 3200000000, description: 'Overall credit limit', required: false })
  @IsNumber()
  @IsOptional()
  overallCreditLimit?: number;

  @ApiProperty({ example: 3200000000, description: 'Transaction credit limit', required: false })
  @IsNumber()
  @IsOptional()
  trxCreditLimit?: number;

  @ApiProperty({ example: 2004, description: 'Payment term ID', required: false })
  @IsNumber()
  @IsOptional()
  termId?: number;

  @ApiProperty({ example: '21 Hari', description: 'Payment term name', required: false })
  @IsString()
  @IsOptional()
  termName?: string;

  @ApiProperty({ example: 21, description: 'Payment term days', required: false })
  @IsNumber()
  @IsOptional()
  termDay?: number;

  @ApiProperty({ example: 7011, description: 'Price list ID', required: false })
  @IsNumber()
  @IsOptional()
  priceListId?: number;

  @ApiProperty({ example: 'PL - WS / NKA', description: 'Price list name', required: false })
  @IsString()
  @IsOptional()
  priceListName?: string;

  @ApiProperty({ example: 1001, description: 'Order type ID', required: false })
  @IsNumber()
  @IsOptional()
  orderTypeId?: number;

  @ApiProperty({ example: 'Standard Order', description: 'Order type name', required: false })
  @IsString()
  @IsOptional()
  orderTypeName?: string;

  @ApiProperty({ example: 2001, description: 'Return order type ID', required: false })
  @IsNumber()
  @IsOptional()
  returnOrderTypeId?: number;

  @ApiProperty({ example: 'Standard Return', description: 'Return order type name', required: false })
  @IsString()
  @IsOptional()
  returnOrderTypeName?: string;

  @ApiProperty({ example: '2024-06-01 19:12:27', description: 'Last update date from source system', required: false })
  @IsString()
  @IsOptional()
  lastUpdateDate?: string;
}

