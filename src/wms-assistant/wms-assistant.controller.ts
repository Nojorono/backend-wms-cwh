import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WmsAssistantChatRequestDto } from './dto/wms-assistant-chat-request.dto';
import {
  WmsAssistantChatResponseDto,
  WmsAssistantHealthResponseDto,
  WmsAssistantModelsResponseDto,
} from './dto/wms-assistant-response.dto';
import { WmsAssistantService } from './wms-assistant.service';

@ApiTags('WMS Assistant')
@ApiBearerAuth('JWT-auth')
@Controller('wms-assistant')
export class WmsAssistantController {
  constructor(private readonly service: WmsAssistantService) {}

  @Post('chat')
  @ApiOperation({
    summary: 'Chat with WMS Assistant (Ollama)',
    description:
      'Sends a message to the local Ollama model with WMS system context. Default model: qwen3:8b.',
  })
  @ApiResponse({ status: 200, type: WmsAssistantChatResponseDto })
  chat(@Body() dto: WmsAssistantChatRequestDto): Promise<WmsAssistantChatResponseDto> {
    return this.service.chat(dto);
  }

  @Get('models')
  @ApiOperation({ summary: 'List Ollama models available on the server' })
  @ApiResponse({ status: 200, type: WmsAssistantModelsResponseDto })
  listModels(): Promise<WmsAssistantModelsResponseDto> {
    return this.service.listModels();
  }

  @Get('health')
  @ApiOperation({ summary: 'Check Ollama connectivity' })
  @ApiResponse({ status: 200, type: WmsAssistantHealthResponseDto })
  health(): Promise<WmsAssistantHealthResponseDto> {
    return this.service.health();
  }
}
