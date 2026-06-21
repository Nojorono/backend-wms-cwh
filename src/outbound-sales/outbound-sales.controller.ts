import { Controller, Get, Query } from '@nestjs/common';
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

@ApiTags('Outbound Sales')
@ApiBearerAuth('JWT-auth')
@Controller('outbound-sales')
export class OutboundSalesController {
  constructor(private readonly service: OutboundSalesService) { }

  @Get('on-hand')
  @ApiOperation({
    summary: 'Find Oracle on-hand quantity with attributes for outbound sales',
    description:
      'Filters by organization_code, subinventory_code, and date (YYYY-MM-DD). ' +
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
}
