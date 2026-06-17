import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DoSuggestion } from '../core/domain/entities/do-suggestion.entity';
import { DoSuggestionService } from './do-suggestion.service';
import { CreateOrUpdateDoSuggestionDto } from './dto/create-or-update-do-suggestion.dto';

@ApiTags('DO Suggestion')
@Controller('do-suggestion')
@ApiBearerAuth('JWT-auth')
export class DoSuggestionController {
  constructor(private readonly doSuggestionService: DoSuggestionService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create or update DO suggestion with lines',
    description:
      'Omit `id` to create. Include `id` to update header and replace all detail lines.',
  })
  @ApiResponse({ status: 200, type: DoSuggestion })
  createOrUpdate(@Body() dto: CreateOrUpdateDoSuggestionDto): Promise<DoSuggestion> {
    return this.doSuggestionService.createOrUpdate(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all DO suggestions with details' })
  @ApiResponse({ status: 200, type: [DoSuggestion] })
  findAll(): Promise<DoSuggestion[]> {
    return this.doSuggestionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get DO suggestion by ID with details' })
  @ApiResponse({ status: 200, type: DoSuggestion })
  findOne(@Param('id') id: string): Promise<DoSuggestion> {
    return this.doSuggestionService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete DO suggestion' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.doSuggestionService.remove(id);
  }
}
