import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
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

  @Get(':inbound_plan_id')
  @ApiOperation({ summary: 'Get a Attachment by inbound_plan_id' })
  @ApiResponse({ status: 200, description: 'Return the Attachment.', type: InboundAttachment })
  @ApiResponse({ status: 404, description: 'Attachment not found.' })
  findByInboundPlanId(@Param('inbound_plan_id') inbound_plan_id: string) {
    return this.inboundAttachmentService.findByInboundPlanId(inbound_plan_id);
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

  @Post('upload')
  @ApiOperation({ summary: 'Upload file to S3 and save to database' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        inboundPlanId: { type: 'string', example: 'uuid' },
        organizationId: { type: 'number', example: 1 },
        acl: { 
          type: 'string', 
          enum: ['private', 'public-read', 'public-read-write', 'authenticated-read'],
          example: 'private'
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully', type: InboundAttachment })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Body('inboundPlanId') inboundPlanId?: string,
    @Body('organizationId') organizationId?: number,
    @Body('acl') acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read',
  ) {
    const attachment = await this.inboundAttachmentService.uploadFileWithDatabase(
      file.buffer,
      file.originalname,
      inboundPlanId,
      organizationId,
      {
        contentType: file.mimetype,
        acl: acl || 'private',
      }
    );

    return {
      success: true,
      data: attachment,
      message: 'File uploaded successfully',
    };
  }

  @Get(':id/url')
  @ApiOperation({ summary: 'Get file download URL' })
  @ApiResponse({ status: 200, description: 'File URL retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFileUrl(@Param('id') id: string) {
    const url = await this.inboundAttachmentService.getFileUrl(id);
    
    return {
      success: true,
      data: { url },
      message: 'File URL retrieved successfully',
    };
  }

  @Delete(':id/with-s3')
  @ApiOperation({ summary: 'Delete file from S3 and database' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFileWithS3(@Param('id') id: string) {
    await this.inboundAttachmentService.deleteFileWithS3(id);
    
    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  @Patch(':id/acl')
  @ApiOperation({ summary: 'Update file ACL (public/private)' })
  @ApiResponse({ status: 200, description: 'File ACL updated successfully', type: InboundAttachment })
  @ApiResponse({ status: 404, description: 'File not found' })
  async updateFileAcl(
    @Param('id') id: string,
    @Body() body: { acl: 'private' | 'public-read' }
  ) {
    const attachment = await this.inboundAttachmentService.updateFileAcl(id, body.acl);
    
    return {
      success: true,
      data: attachment,
      message: `File ACL updated to ${body.acl}`,
    };
  }
} 