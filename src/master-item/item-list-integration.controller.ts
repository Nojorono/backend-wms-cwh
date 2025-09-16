import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ItemListIntegrationService } from './integration/item-list-integration.service';
import { ItemListQueryDto } from './dto/item-list-query.dto';

@ApiTags('Item List Integration')
@Controller('item-list-integration')
@ApiBearerAuth('JWT-auth')
export class ItemListIntegrationController {
  constructor(
    private readonly itemListIntegrationService: ItemListIntegrationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all items via RabbitMQ' })
  @ApiResponse({
    status: 200,
    description: 'Return all items from RabbitMQ service.',
  })
  async getItemLists(@Query() query: ItemListQueryDto) {
    return this.itemListIntegrationService.getItemLists(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search items via RabbitMQ' })
  @ApiResponse({
    status: 200,
    description: 'Return search results from RabbitMQ service.',
  })
  async searchItems(@Query('q') searchTerm: string) {
    return this.itemListIntegrationService.searchItemLists(searchTerm);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID via RabbitMQ' })
  @ApiResponse({
    status: 200,
    description: 'Return item by ID from RabbitMQ service.',
  })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  async getItemById(@Param('id') id: string) {
    return this.itemListIntegrationService.getItemListById(id);
  }

  @Post('cache/invalidate')
  @ApiOperation({ summary: 'Invalidate item list cache' })
  @ApiResponse({
    status: 200,
    description: 'Cache invalidation result.',
  })
  async invalidateCache(@Body() body: { itemId?: string }) {
    return this.itemListIntegrationService.invalidateItemListCache(body.itemId);
  }
}
