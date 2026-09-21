import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OutboundSalesService } from './outbound-sales.service';
import {
  InvOnHandQtyWithAtrItemDto,
  InvOnHandQtyWithAtrParamsDto,
  onHandAtrDateNowExample,
} from './dto/inv-on-hand-qty-with-atr.dto';
import { OrganizationId } from 'src/core/decorators/organization-id.decorator';
import { OnHandAtr } from '../core/domain/entities/on-hand-atr.entity';
import { TotalSubmittedQueryDto } from './dto/total-submitted-query.dto';
import { TotalSubmittedResponseDto } from './dto/total-submitted-response.dto';
import {
  LocatorSalesParamsDto,
  LocatorSalesResponseDto,
} from './dto/locator-sales.dto';
import { DistinctLocatorByOrganizationDto } from './dto/distinct-locator-by-organization.dto';
import {
  LhsReportQueryDto,
  LHSReportDetailResponseDto,
  LHSReportResponseDto,
} from './dto/lhs-report.dto';
import {
  InventoryLocatorItemDto,
  InventoryLocatorParamsDto,
} from './dto/inventory-locator.dto';

@ApiTags('Outbound Sales')
@ApiBearerAuth('JWT-auth')
@Controller('outbound-sales')
export class OutboundSalesController {
  constructor(private readonly service: OutboundSalesService) { }

  @Get('on-hand-meta')
  @ApiOperation({
    summary: 'Find Oracle inventory locator',
    description:
      'Find Oracle inventory locator by organization_code and subinventory_code.',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  findOnHandMeta(
    @Query() query: InvOnHandQtyWithAtrParamsDto,
  ): Promise<any> {
    return this.service.findOnHandMeta(query);
  }

  @Get('on-hand-locator')
  @ApiOperation({
    summary: 'Find Oracle inventory locator by organization_code and subinventory_code',
    description:
      'Calls get_inv_locator. Returns locator rows directly (no nested data wrapper).',
  })
  @ApiResponse({ status: 200, description: 'OK', type: [InventoryLocatorItemDto] })
  findOnHandLocator(
    @Query() query: InventoryLocatorParamsDto,
  ): Promise<InventoryLocatorItemDto[]> {
    return this.service.findOnHandLocator(query);
  }

  @Get('on-hand')
  @ApiOperation({
    summary: 'Find Oracle on-hand quantity with attributes for outbound sales',
    description:
      'Filters by organization_code, subinventory_code, and saved date (YYYY-MM-DD, WIB). ' +
      `Example: GET /outbound-sales/on-hand?organization_code=JAT&subinventory_code=KECIL&date=${onHandAtrDateNowExample()}`,
  })
  @ApiResponse({ status: 200, description: 'OK', type: [InvOnHandQtyWithAtrItemDto] })
  findOnHand(
    @Query() query: InvOnHandQtyWithAtrParamsDto,
    @OrganizationId() organizationId: string | number | null,
  ): Promise<OnHandAtr[]> {
    return this.service.findOnHand(query, organizationId);
  }

  @Get('total-submitted')
  @ApiOperation({
    summary: 'List all items with total submitted qty from DO suggestion (SUBMITTED status)',
    description:
      'Returns every item_code with summed item_qty_submitted from DO suggestions ' +
      'where status is SUBMITTED, filtered by organization (JWT) and callplan_date_start (date).',
  })
  @ApiResponse({ status: 200, description: 'OK', type: TotalSubmittedResponseDto })
  getTotalSubmitted(
    @Query() query: TotalSubmittedQueryDto,
    @OrganizationId() organizationId: string | number | null,
  ): Promise<TotalSubmittedResponseDto> {
    return this.service.getTotalSubmitted(organizationId, query.date);
  }

  @Get('locator-sales')
  @ApiOperation({
    summary: 'Get locator sales data from RMQ microservice',
    description:
      'Calls INV_ON_HAND_QTY_SERVICE pattern get_locator_sales with organization_code and salesrep_number.',
  })
  @ApiResponse({ status: 200, description: 'OK', type: LocatorSalesResponseDto })
  getLocatorSales(@Query() query: LocatorSalesParamsDto): Promise<LocatorSalesResponseDto> {
    return this.service.getLocatorSales(query);
  }

  @Get('locators/distinct/:organizationId')
  @ApiOperation({
    summary: 'Get distinct locators by organization ID',
    description:
      'Returns distinct organization_code, organization_name, subinventory_code, locator_id, locator, and locator_name from on_hand_atr by organizationId param.',
  })
  @ApiResponse({ status: 200, description: 'OK', type: [DistinctLocatorByOrganizationDto] })
  getDistinctLocatorsByOrganizationId(
    @Param('organizationId') organizationId: string,
  ): Promise<DistinctLocatorByOrganizationDto[]> {
    return this.service.getDistinctLocatorsByOrganizationId(organizationId);
  }

  @Get('report/lhs')
  @ApiOperation({
    summary: 'Get LHS report',
    description:
      'Per-item LHS for JWT organization and date H. ' +
      'stock_awal = on_hand_atr qty on H-1; stock_meta = on_hand_atr qty on H; ' +
      'outgoing = max(qty_final - qty_submitted, 0); ' +
      'incoming = abs(qty_final - qty_submitted) when negative + BTB qty on H. ' +
      `Example: GET /outbound-sales/report/lhs?date=${onHandAtrDateNowExample()}`,
  })
  @ApiResponse({ status: 200, description: 'OK', type: LHSReportResponseDto })
  getLHSReport(
    @Query() query: LhsReportQueryDto,
    @OrganizationId() organizationId: string | number | null,
  ): Promise<LHSReportResponseDto> {
    return this.service.getLHSReport(organizationId, query.date);
  }

  @Get('report/lhs/detail')
  @ApiOperation({
    summary: 'Get LHS report detail (SKU matrix per sales)',
    description:
      'Matrix like spreadsheet: item_codes as columns; rows = Stock Awal, ' +
      'Incoming/BTB per sales, Outgoing/SPB Submitted per sales, Stock Meta. ' +
      `Example: GET /outbound-sales/report/lhs/detail?date=${onHandAtrDateNowExample()}`,
  })
  @ApiResponse({ status: 200, description: 'OK', type: LHSReportDetailResponseDto })
  getLHSReportDetail(
    @Query() query: LhsReportQueryDto,
    @OrganizationId() organizationId: string | number | null,
  ): Promise<LHSReportDetailResponseDto> {
    return this.service.getLHSReportDetail(organizationId, query.date);
  }
}
