import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InboundAttachmentService } from './inbound-attachment.service';
import { CreateInboundAttachmentDto } from './dto/create-inbound-attachment.dto';
import { UpdateInboundAttachmentDto } from './dto/update-inbound-attachment.dto';
import { InboundAttachment } from '../core/domain/entities/inbound-attachment.entity';

@ApiTags('Inbound Attachment')
@Controller('inbound-attachment')
@ApiBearerAuth('JWT-auth')
export class InboundAttachmentController {
  constructor(private readonly inboundAttachmentService: InboundAttachmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new IO' })
  @ApiResponse({ status: 201, description: 'The IO has been successfully created.', type: InboundAttachment })
  @ApiResponse({ status: 409, description: 'IO with this code already exists.' })
  create(@Body() createInboundAttachmentDto: CreateInboundAttachmentDto) {
    return this.inboundAttachmentService.create(createInboundAttachmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all UOMs' })
  @ApiResponse({ status: 200, description: 'Return all IOs.', type: [InboundAttachment] })
  findAll() {
      return this.inboundAttachmentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a IO by id' })
  @ApiResponse({ status: 200, description: 'Return the IO.', type: InboundAttachment })
  @ApiResponse({ status: 404, description: 'IO not found.' })
  findOne(@Param('id') id: string) {
    return this.inboundAttachmentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a IO' })
  @ApiResponse({ status: 200, description: 'The IO has been successfully updated.', type: InboundAttachment })
  @ApiResponse({ status: 404, description: 'IO not found.' })
  @ApiResponse({ status: 409, description: 'IO with this code already exists.' })
  update(
    @Param('id') id: string,
    @Body() updateInboundAttachmentDto: UpdateInboundAttachmentDto,
  ) {
    return this.inboundAttachmentService.update(id, updateInboundAttachmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a IO' })
  @ApiResponse({ status: 200, description: 'The IO has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'IO not found.' })
  remove(@Param('id') id: string) {
    return this.inboundAttachmentService.remove(id);
  }
} 