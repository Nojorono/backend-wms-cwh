import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ScheduledTask } from '../core/domain/entities/scheduled-task.entity';
import { ScheduledTaskService } from './scheduled-task.service';

@ApiTags('Scheduled Task')
@Controller('scheduled-task')
@ApiBearerAuth('JWT-auth')
export class ScheduledTaskController {
  constructor(private readonly scheduledTaskService: ScheduledTaskService) {}

  @Get()
  @ApiOperation({ summary: 'List persisted scheduled tasks' })
  @ApiResponse({ status: 200, description: 'Return all scheduled tasks.', type: [ScheduledTask] })
  findAll() {
    return this.scheduledTaskService.findAll();
  }

  @Get('callbacks')
  @ApiOperation({ summary: 'List available callback types' })
  getCallbackTypes() {
    return this.scheduledTaskService.getCallbackTypes();
  }

  @Delete(':name/hard')
  @ApiOperation({ summary: 'Permanently delete a scheduled job' })
  hardDeleteJob(@Param('name') name: string) {
    return this.scheduledTaskService.hardDeleteJob(name);
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Soft delete a scheduled job' })
  deleteJob(@Param('name') name: string) {
    return this.scheduledTaskService.deleteJob(name);
  }
}
