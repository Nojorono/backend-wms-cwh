import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery 
} from '@nestjs/swagger';
import { UserManageService } from './user-manage.service';
import { CreateUserManageDto } from './dto/create-user-manage.dto';
import { UpdateUserManageDto } from './dto/update-user-manage.dto';
import { UserManagePaginationDto } from './dto/user-manage-pagination.dto';
import { UserManage } from '../core/domain/entities/user-manage.entity';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';

@ApiTags('User Management')
@Controller('user-manage')
@ApiBearerAuth('JWT-auth')
export class UserManageController {
  constructor(private readonly userManageService: UserManageService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: UserManage,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data.',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this phone number already exists.',
  })
  create(@Body() createUserManageDto: CreateUserManageDto) {
    return this.userManageService.create(createUserManageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users or search with pagination' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for name, phone, or role name' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Field to sort by', example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order', enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Return all users or paginated results.',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/UserManage' }
        },
        { $ref: '#/components/schemas/PaginatedResponseDto' }
      ]
    }
  })
  findAll(@Query() paginationDto: UserManagePaginationDto) {
    // Check if any pagination parameters are provided
    const hasPaginationParams = paginationDto.search || paginationDto.page || paginationDto.limit || 
                               paginationDto.sortBy || paginationDto.sortOrder;
    
    if (hasPaginationParams) {
      return this.userManageService.findAllWithPagination(paginationDto);
    }
    
    return this.userManageService.findAll();
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all users (alternative endpoint)' })
  @ApiResponse({
    status: 200,
    description: 'Return all users.',
    type: [UserManage],
  })
  findAllUsers() {
    return this.userManageService.findAll();
  }


  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the user.',
    type: UserManage,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid user ID.' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found.' 
  })
  findOne(@Param('id') id: string) {
    return this.userManageService.findOne(id);
  }

  @Get('phone/:phone')
  @ApiOperation({ summary: 'Get a user by phone number' })
  @ApiResponse({
    status: 200,
    description: 'Return the user.',
    type: UserManage,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid phone number.' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found.' 
  })
  findByPhone(@Param('phone') phone: string) {
    return this.userManageService.findByPhone(phone);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
    type: UserManage,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid input data or user ID.' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found.' 
  })
  @ApiResponse({
    status: 409,
    description: 'User with this phone number already exists.',
  })
  update(@Param('id') id: string, @Body() updateUserManageDto: UpdateUserManageDto) {
    return this.userManageService.update(id, updateUserManageDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user (soft delete)' })
  @ApiResponse({
    status: 204,
    description: 'The user has been successfully deleted.',
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid user ID.' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found.' 
  })
  remove(@Param('id') id: string) {
    return this.userManageService.remove(id);
  }
}
