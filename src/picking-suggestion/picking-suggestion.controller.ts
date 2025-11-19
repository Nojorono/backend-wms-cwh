import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PickingSuggestionService } from './picking-suggestion.service';
import { PickingSuggestionDto } from './dto/picking-suggestion.dto';

@ApiTags('Picking Suggestion')
@Controller('picking-suggestion')
@ApiBearerAuth('JWT-auth')
export class PickingSuggestionController {
  constructor(private readonly pickingSuggestionService: PickingSuggestionService) {}

  @Get('outbound-do/:outboundDoId')
  @ApiOperation({ summary: 'Get picking suggestions for an outbound DO' })
  @ApiParam({ name: 'outboundDoId', description: 'Outbound DO ID' })
  @ApiResponse({
    status: 200,
    description: 'Picking suggestions generated successfully',
    type: [PickingSuggestionDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Outbound DO not found',
  })
  async getPickingSuggestionsForOutboundDo(@Param('outboundDoId') outboundDoId: string) {
    return this.pickingSuggestionService.getPickingSuggestionsForOutboundDo(outboundDoId);
  }

  @Get('memo/:memoId')
  @ApiOperation({ summary: 'Get picking suggestions for a memo' })
  @ApiParam({ name: 'memoId', description: 'Outbound memo ID' })
  @ApiResponse({
    status: 200,
    description: 'Picking suggestions generated successfully',
    type: [PickingSuggestionDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Memo not found',
  })
  async getPickingSuggestionsByMemo(@Param('memoId') memoId: string) {
    return this.pickingSuggestionService.getPickingSuggestionsByMemo(memoId);
  }

  @Get('item/:itemId')
  @ApiOperation({ summary: 'Get picking suggestions for an item' })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  @ApiQuery({
    name: 'uom',
    required: false,
    description: 'Filter available inventory by item UOM',
    example: 'PCS',
  })
  @ApiResponse({
    status: 200,
    description: 'Picking suggestions generated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found',
  })
  async getPickingSuggestionsByItemId(
    @Param('itemId') itemId: string,
    @Query('uom') uom?: string,
  ) {
    return this.pickingSuggestionService.getPickingSuggestionsByItemId(itemId, uom);
  }
}

