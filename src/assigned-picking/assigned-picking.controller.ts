import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AssignedPickingService } from './assigned-picking.service';
import { CreateAssignedPickingDto } from './dto/create-assigned-picking.dto';
import { UpdateAssignedPickingDto } from './dto/update-assigned-picking.dto';
import { AssignedPicking } from '../core/domain/entities/assigned-picking.entity';

@ApiTags('Assigned Picking')
@Controller('assigned-picking')
@ApiBearerAuth('JWT-auth')
export class AssignedPickingController {
  constructor(private readonly service: AssignedPickingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new assigned picking' })
  @ApiResponse({
    status: 201,
    description: 'Assigned picking berhasil dibuat',
    type: AssignedPicking,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - data tidak valid',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user sudah ditugaskan untuk memo ini',
  })
  async create(@Body() createAssignedPickingDto: CreateAssignedPickingDto) {
    return await this.service.create(createAssignedPickingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assigned picking' })
  @ApiResponse({
    status: 200,
    description: 'Daftar assigned picking',
    type: [AssignedPicking],
  })
  async findAll() {
    return await this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assigned picking by ID' })
  @ApiParam({ name: 'id', description: 'ID assigned picking' })
  @ApiResponse({
    status: 200,
    description: 'Detail assigned picking',
    type: AssignedPicking,
  })
  @ApiResponse({
    status: 404,
    description: 'Assigned picking tidak ditemukan',
  })
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update assigned picking' })
  @ApiParam({ name: 'id', description: 'ID assigned picking' })
  @ApiResponse({
    status: 200,
    description: 'Assigned picking berhasil diupdate',
    type: AssignedPicking,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - data tidak valid',
  })
  @ApiResponse({
    status: 404,
    description: 'Assigned picking tidak ditemukan',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user sudah ditugaskan untuk memo ini',
  })
  async update(
    @Param('id') id: string,
    @Body() updateAssignedPickingDto: UpdateAssignedPickingDto,
  ) {
    return await this.service.update(id, updateAssignedPickingDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete assigned picking' })
  @ApiParam({ name: 'id', description: 'ID assigned picking' })
  @ApiResponse({
    status: 204,
    description: 'Assigned picking berhasil dihapus',
  })
  @ApiResponse({
    status: 404,
    description: 'Assigned picking tidak ditemukan',
  })
  async remove(@Param('id') id: string) {
    return await this.service.remove(id);
  }

  @Get('memo/:memoId')
  @ApiOperation({ summary: 'Get assigned picking by memo ID' })
  @ApiParam({ name: 'memoId', description: 'ID outbound memo' })
  @ApiResponse({
    status: 200,
    description: 'Daftar assigned picking berdasarkan memo',
    type: [AssignedPicking],
  })
  async findByMemoId(@Param('memoId') memoId: string) {
    return await this.service.findByMemoId(memoId);
  }

  @Get('user/:pickingUserId')
  @ApiOperation({ summary: 'Get assigned picking by picking user ID' })
  @ApiParam({ name: 'pickingUserId', description: 'ID picking user' })
  @ApiResponse({
    status: 200,
    description: 'Daftar assigned picking berdasarkan user',
    type: [AssignedPicking],
  })
  async findByPickingUserId(@Param('pickingUserId') pickingUserId: string) {
    return await this.service.findByPickingUserId(pickingUserId);
  }

  @Get('name/:pickingName')
  @ApiOperation({ summary: 'Get assigned picking by picking name' })
  @ApiParam({ name: 'pickingName', description: 'Nama picking user' })
  @ApiResponse({
    status: 200,
    description: 'Daftar assigned picking berdasarkan nama',
    type: [AssignedPicking],
  })
  async findByPickingName(@Param('pickingName') pickingName: string) {
    return await this.service.findByPickingName(pickingName);
  }

  @Get('check/:memoId/:pickingUserId')
  @ApiOperation({ summary: 'Check if assignment exists for memo and user' })
  @ApiParam({ name: 'memoId', description: 'ID outbound memo' })
  @ApiParam({ name: 'pickingUserId', description: 'ID picking user' })
  @ApiResponse({
    status: 200,
    description: 'Status assignment',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            exists: { type: 'boolean' },
          },
        },
      },
    },
  })
  async checkAssignmentExists(
    @Param('memoId') memoId: string,
    @Param('pickingUserId') pickingUserId: string,
  ) {
    return await this.service.checkAssignmentExists(memoId, pickingUserId);
  }

  @Patch(':id/reassign')
  @ApiOperation({ summary: 'Reassign picking to different user' })
  @ApiParam({ name: 'id', description: 'ID assigned picking' })
  @ApiResponse({
    status: 200,
    description: 'Assigned picking berhasil di-reassign',
    type: AssignedPicking,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - data tidak valid',
  })
  @ApiResponse({
    status: 404,
    description: 'Assigned picking tidak ditemukan',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user sudah ditugaskan untuk memo ini',
  })
  async reassignPicking(
    @Param('id') id: string,
    @Body()
    reassignData: {
      picking_user_id: string;
      picking_name: string;
      picking_phone?: string;
    },
  ) {
    return await this.service.reassignPicking(
      id,
      reassignData.picking_user_id,
      reassignData.picking_name,
      reassignData.picking_phone,
    );
  }
}
