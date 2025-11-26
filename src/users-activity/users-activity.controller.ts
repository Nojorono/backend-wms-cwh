import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { UsersActivityService } from './users-activity.service';
import { CreateUsersActivityDto } from './dto/create-users-activity.dto';
import { UsersActivityPaginationDto } from './dto/users-activity-pagination.dto';
import { UsersActivity, UserActivityAction } from '../core/domain/entities/users-activity.entity';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';

@ApiTags('User Activity')
@Controller('user-activity')
@ApiBearerAuth('JWT-auth')
export class UsersActivityController {
  constructor(private readonly usersActivityService: UsersActivityService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user activity log' })
  @ApiResponse({ status: 201, description: 'User activity logged successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createDto: CreateUsersActivityDto): Promise<UsersActivity> {
    return this.usersActivityService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user activities with pagination' })
  @ApiResponse({ status: 200, description: 'List of user activities' })
  async findAll(
    @Query() paginationDto: UsersActivityPaginationDto,
  ): Promise<PaginatedResponseDto<UsersActivity>> {
    return this.usersActivityService.findAllPaginated(paginationDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get activity statistics' })
  @ApiQuery({ name: 'user_id', required: false, type: String })
  @ApiQuery({ name: 'date_from', required: false, type: Date })
  @ApiQuery({ name: 'date_to', required: false, type: Date })
  @ApiResponse({ status: 200, description: 'Activity statistics' })
  async getStats(
    @Query('user_id') userId?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    const fromDate = dateFrom ? new Date(dateFrom) : undefined;
    const toDate = dateTo ? new Date(dateTo) : undefined;
    return this.usersActivityService.getActivityStats(userId, fromDate, toDate);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get activities by user ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'List of user activities' })
  async findByUserId(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ): Promise<UsersActivity[]> {
    return this.usersActivityService.findByUserId(userId, limit);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get activities by entity type and ID' })
  @ApiResponse({ status: 200, description: 'List of entity activities' })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ): Promise<UsersActivity[]> {
    return this.usersActivityService.findByEntity(entityType, entityId);
  }

  @Get('action/:action')
  @ApiOperation({ summary: 'Get activities by action type' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 100 })
  @ApiResponse({ status: 200, description: 'List of activities by action' })
  async findByAction(
    @Param('action') action: UserActivityAction,
    @Query('limit') limit?: number,
  ): Promise<UsersActivity[]> {
    return this.usersActivityService.findByAction(action, limit);
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get activities by date range' })
  @ApiQuery({ name: 'date_from', required: true, type: Date })
  @ApiQuery({ name: 'date_to', required: true, type: Date })
  @ApiResponse({ status: 200, description: 'List of activities in date range' })
  async findByDateRange(
    @Query('date_from') dateFrom: string,
    @Query('date_to') dateTo: string,
  ): Promise<UsersActivity[]> {
    return this.usersActivityService.findByDateRange(new Date(dateFrom), new Date(dateTo));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user activity by ID' })
  @ApiResponse({ status: 200, description: 'User activity details' })
  @ApiResponse({ status: 404, description: 'User activity not found' })
  async findOne(@Param('id') id: string): Promise<UsersActivity> {
    return this.usersActivityService.findOne(id);
  }
}

