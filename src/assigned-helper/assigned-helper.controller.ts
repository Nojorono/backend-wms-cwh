import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AssignedHelperService } from './assigned-helper.service';
import { CreateAssignedHelperDto } from './dto/create-assigned-helper.dto';
import { UpdateAssignedHelperDto } from './dto/update-assigned-helper.dto';
import { AssignedHelper } from '../core/domain/entities/assigned-helper.entity';

@ApiTags('Assigned Helper')
@Controller('assigned-helper')
@ApiBearerAuth('JWT-auth')
export class AssignedHelperController {
  constructor(private readonly assignedHelperService: AssignedHelperService) {}

  @Post()
  @ApiOperation({ summary: 'Create assigned helper' })
  @ApiResponse({ 
    status: 201, 
    description: 'Assigned helper created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-123' },
        inbound_id: { type: 'string', example: 'uuid-inbound-123' },
        helper_user_id: { type: 'string', example: 'uuid-user-123' },
        helper_name: { type: 'string', example: 'John Doe' },
        helper_phone: { type: 'string', example: '+6281234567890' },
        createdAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
        inbound: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-inbound-123' },
            inbound_number: { type: 'string', example: 'INB-2025-001' },
            expedition: { type: 'string', example: 'Carrier A' },
            status: { type: 'string', example: 'CREATED' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  create(@Body() createAssignedHelperDto: CreateAssignedHelperDto) {
    return this.assignedHelperService.create(createAssignedHelperDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all assigned helpers' })
  @ApiQuery({ 
    name: 'inbound_id', 
    required: false, 
    type: String,
    description: 'Filter by inbound ID',
    example: 'uuid-inbound-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of assigned helpers retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-123' },
          inbound_id: { type: 'string', example: 'uuid-inbound-123' },
          helper_user_id: { type: 'string', example: 'uuid-user-123' },
          helper_name: { type: 'string', example: 'John Doe' },
          helper_phone: { type: 'string', example: '+6281234567890' },
          createdAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
          inbound: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-inbound-123' },
              inbound_number: { type: 'string', example: 'INB-2025-001' },
              expedition: { type: 'string', example: 'Carrier A' },
              status: { type: 'string', example: 'CREATED' }
            }
          }
        }
      }
    }
  })
  findAll(@Query('inbound_id') inboundId?: string) {
    if (inboundId) {
      return this.assignedHelperService.findAllByInbound(inboundId);
    }
    return this.assignedHelperService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assigned helper by id' })
  @ApiResponse({ 
    status: 200, 
    description: 'Assigned helper retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-123' },
        inbound_id: { type: 'string', example: 'uuid-inbound-123' },
        helper_user_id: { type: 'string', example: 'uuid-user-123' },
        helper_name: { type: 'string', example: 'John Doe' },
        helper_phone: { type: 'string', example: '+6281234567890' },
        createdAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
        inbound: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-inbound-123' },
            inbound_number: { type: 'string', example: 'INB-2025-001' },
            expedition: { type: 'string', example: 'Carrier A' },
            status: { type: 'string', example: 'CREATED' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Assigned helper not found' })
  findOne(@Param('id') id: string) {
    return this.assignedHelperService.findOne(id);
  }

  // find by inbound id
  @Get('inbound/:inbound_id')
  @ApiOperation({ summary: 'Get assigned helper by inbound ID' })
  @ApiResponse({ status: 200, description: 'Assigned helper retrieved successfully', type: AssignedHelper })
  findByInboundId(@Param('inbound_id') inbound_id: string) {
    return this.assignedHelperService.findByInboundId(inbound_id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update assigned helper' })
  @ApiResponse({ 
    status: 200, 
    description: 'Assigned helper updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-123' },
        inbound_id: { type: 'string', example: 'uuid-inbound-123' },
        helper_user_id: { type: 'string', example: 'uuid-user-123' },
        helper_name: { type: 'string', example: 'John Doe' },
        helper_phone: { type: 'string', example: '+6281234567890' },
        createdAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
        inbound: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-inbound-123' },
            inbound_number: { type: 'string', example: 'INB-2025-001' },
            expedition: { type: 'string', example: 'Carrier A' },
            status: { type: 'string', example: 'CREATED' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Assigned helper not found' })
  update(@Param('id') id: string, @Body() updateAssignedHelperDto: UpdateAssignedHelperDto) {
    return this.assignedHelperService.update(id, updateAssignedHelperDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete assigned helper' })
  @ApiResponse({ status: 200, description: 'Assigned helper deleted successfully' })
  @ApiResponse({ status: 404, description: 'Assigned helper not found' })
  remove(@Param('id') id: string) {
    return this.assignedHelperService.remove(id);
  }
}
