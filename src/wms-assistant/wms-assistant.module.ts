import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OllamaService } from './integration/ollama.service';
import { WmsAssistantController } from './wms-assistant.controller';
import { WmsAssistantService } from './wms-assistant.service';

@Module({
  imports: [ConfigModule],
  controllers: [WmsAssistantController],
  providers: [WmsAssistantService, OllamaService],
  exports: [WmsAssistantService, OllamaService],
})
export class WmsAssistantModule {}
