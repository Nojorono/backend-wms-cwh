import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../core/domain/entities/user.entity';

@ApiTags('User')
@Controller('user')
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new User' })
  @ApiResponse({ status: 201, description: 'The User has been successfully created.', type: User })
  @ApiResponse({ status: 409, description: 'User with this code already exists.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Users' })
  @ApiResponse({ status: 200, description: 'Return all Users.', type: [User] })
  findAll() {
      return this.userService.findAll();
  }

  @Get('deleted')
  @ApiOperation({ summary: 'Get all Users including deleted ones' })
  @ApiResponse({ status: 200, description: 'Return all Users including deleted ones.', type: [User] })
  findAllWithDeleted() {
      return this.userService.findAllWithDeleted();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a User by id' })
  @ApiResponse({ status: 200, description: 'Return the User.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Get(':id/deleted')
  @ApiOperation({ summary: 'Get a User by id including deleted ones' })
  @ApiResponse({ status: 200, description: 'Return the User including deleted ones.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOneWithDeleted(@Param('id') id: string) {
    return this.userService.findOneWithDeleted(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a User' })
  @ApiResponse({ status: 200, description: 'The User has been successfully updated.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 409, description: 'User with this code already exists.' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a User' })
  @ApiResponse({ status: 200, description: 'The User has been successfully soft deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Put(':id/restore')
  @ApiOperation({ summary: 'Restore a soft deleted User' })
  @ApiResponse({ status: 200, description: 'The User has been successfully restored.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 409, description: 'User is not deleted.' })
  restore(@Param('id') id: string) {
    return this.userService.restore(id);
  }

  @Delete(':id/hard')
  @ApiOperation({ summary: 'Permanently delete a User' })
  @ApiResponse({ status: 200, description: 'The User has been permanently deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  hardDelete(@Param('id') id: string) {
    return this.userService.hardDelete(id);
  }
} 