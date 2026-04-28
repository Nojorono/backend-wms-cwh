import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  InternalServerErrorException,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PickingSuggestionService } from './picking-suggestion.service';
import { PickingSuggestionDto } from './dto/picking-suggestion.dto';
import { OrganizationId } from '../core/decorators/organization-id.decorator';

@ApiTags('Picking Suggestion')
@Controller('picking-suggestion')
@ApiBearerAuth('JWT-auth')
export class PickingSuggestionController {
  constructor(private readonly pickingSuggestionService: PickingSuggestionService) { }

  @Get('memo/:memoId')
  @ApiOperation({ summary: 'Get picking suggestions for a memo' })
  @ApiParam({ name: 'memoId', description: 'Outbound memo ID' })
  @ApiQuery({
    name: 'sortMethod',
    required: false,
    description: 'Sorting method for inventory picking: FIFO (First In First Out - smallest week_number) or LIFO (Last In First Out - biggest week_number)',
    enum: ['FIFO', 'LIFO'],
    example: 'FIFO',
  })
  @ApiResponse({
    status: 200,
    description: 'Picking suggestions generated successfully',
    type: [PickingSuggestionDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Memo not found',
  })
  async getPickingSuggestionsByMemo(
    @Param('memoId') memoId: string,
    @Query('sortMethod') sortMethod?: 'FIFO' | 'LIFO',
    @OrganizationId() organizationId?: string,
  ) {
    return this.pickingSuggestionService.getPickingSuggestionsByMemo(
      memoId,
      sortMethod,
      organizationId,
    );
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
  @ApiQuery({
    name: 'sortMethod',
    required: false,
    description: 'Sorting method for inventory picking: FIFO (First In First Out - smallest week_number) or LIFO (Last In First Out - biggest week_number)',
    enum: ['FIFO', 'LIFO'],
    example: 'FIFO',
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
    @Query('sortMethod') sortMethod?: 'FIFO' | 'LIFO',
    @OrganizationId() organizationId?: string,
  ) {
    return this.pickingSuggestionService.getPickingSuggestionsByItemId(
      itemId,
      uom,
      sortMethod,
      organizationId,
    );
  }

  @Get('put-away')
  @ApiOperation({
    summary:
      'Get pallets in staging areas with smart suggested destination bin and zone based on same items/weeks',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns each staging pallet with intelligent suggestions based on item and week matching formula',
    schema: {
      type: 'object',
      properties: {
        palletSuggestions: {
          type: 'array',
          description: 'Array of intelligent pallet suggestions with item/week matching',
          items: {
            type: 'object',
            properties: {
              stagingPallet: {
                type: 'object',
                description: 'Pallet currently in staging area with INSPECTION_APPROVED status',
              },
              suggestedBin: {
                type: 'object',
                description:
                  'Smart suggested destination bin (prioritizes bins with same items/weeks)',
              },
              suggestedZone: {
                type: 'object',
                description:
                  'Smart suggested destination zone (prioritizes zones with same items/weeks)',
              },
              palletItems: {
                type: 'array',
                description: 'Items and weeks contained in this pallet',
              },
            },
          },
        },
      },
    },
  })
  async getPutAwaySuggestions(@OrganizationId() organizationId: string) {
    try {
      return await this.pickingSuggestionService.getPutAwaySuggestions(organizationId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException('Failed to get put away suggestions');
    }
  }
}

