import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ScheduledTask } from '../core/domain/entities/scheduled-task.entity';
import { CreateCronTaskDto } from './dto/create-cron-task.dto';
import { ScheduledCallPlanFetchPayloadDto } from './scheduled-call-plan/dto/scheduled-call-plan-fetch-payload.dto';
import { ScheduledCallPlanScheduler } from './scheduled-call-plan/scheduled-call-plan.scheduler';
import { ScheduledCallPlanService } from './scheduled-call-plan/scheduled-call-plan.service';
import { ScheduledOnHandAtrFetchPayloadDto } from './scheduled-on-hand-atr/dto/scheduled-on-hand-atr-fetch-payload.dto';
import { ScheduledOnHandAtrScheduler } from './scheduled-on-hand-atr/scheduled-on-hand-atr.scheduler';
import { ScheduledOnHandAtrService } from './scheduled-on-hand-atr/scheduled-on-hand-atr.service';
import { ScheduledTaskService } from './scheduled-task.service';

@ApiTags('Scheduled Task')
@Controller('scheduled-task')
@ApiBearerAuth('JWT-auth')
export class ScheduledTaskController {
  constructor(
    private readonly scheduledTaskService: ScheduledTaskService,
    private readonly scheduledCallPlanService: ScheduledCallPlanService,
    private readonly scheduledCallPlanScheduler: ScheduledCallPlanScheduler,
    private readonly scheduledOnHandAtrService: ScheduledOnHandAtrService,
    private readonly scheduledOnHandAtrScheduler: ScheduledOnHandAtrScheduler,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List persisted scheduled tasks' })
  @ApiResponse({ status: 200, description: 'Return all scheduled tasks.', type: [ScheduledTask] })
  findAll() {
    return this.scheduledTaskService.findAll();
  }

  @Get('callbacks')
  @ApiOperation({ summary: 'List registered callback handler types' })
  getCallbackTypes() {
    return this.scheduledTaskService.getCallbackTypes();
  }

  @Post('cron')
  @ApiOperation({
    summary: 'Create a persisted cron job',
    description:
      'Registers a cron job in NestJS SchedulerRegistry and persists it to scheduled_tasks.',
  })
  createCronJob(@Body() dto: CreateCronTaskDto) {
    return this.scheduledTaskService.registerCronJob({
      name: dto.name,
      cronTime: dto.cronTime,
      callbackType: dto.callbackType,
      timezone: dto.timezone,
      payload: dto.payload,
      persist: true,
    });
  }

  @Post('call-plan/fetch-now')
  @ApiOperation({ summary: 'Fetch call plan data from Snowflake immediately' })
  @ApiResponse({ status: 200, description: 'Return call plan data from Snowflake.' })
  fetchCallPlanNow(@Body() payload?: ScheduledCallPlanFetchPayloadDto) {
    return this.scheduledCallPlanService.runFetchNow(payload ?? {});
  }

  @Post('on-hand-atr/fetch-now')
  @ApiOperation({
    summary: 'Fetch on-hand ATR for all cabang (BRANCH/SUBBRANCH)',
    description:
      'Resolves cabang from m_io (organization_type BRANCH,SUBBRANCH), then calls findOnHand per branch.',
  })
  @ApiResponse({ status: 201, description: 'On-hand ATR fetch completed for all branches.' })
  fetchOnHandAtrNow(@Body() payload?: ScheduledOnHandAtrFetchPayloadDto) {
    return this.scheduledOnHandAtrService.runFetchNow(payload ?? {});
  }

  @Post('on-hand-atr/bootstrap')
  @ApiOperation({
    summary: 'Re-run on-hand ATR schedule bootstrap',
    description:
      'Applies ON_HAND_ATR_SCHEDULE_MODE from env (database | memory | off).',
  })
  @ApiResponse({ status: 201, description: 'On-hand ATR schedule bootstrap completed.' })
  async bootstrapOnHandAtrSchedule() {
    await this.scheduledOnHandAtrScheduler.bootstrap();
    return {
      success: true,
      message: 'On-hand ATR schedule bootstrap completed',
    };
  }

  @Post('call-plan/bootstrap')
  @ApiOperation({
    summary: 'Re-run call plan schedule bootstrap',
    description:
      'Applies CALL_PLAN_SCHEDULE_MODE from env (database | memory | off). ' +
      'Use after changing cron env vars when mode=memory.',
  })
  @ApiResponse({ status: 201, description: 'Call plan schedule bootstrap completed.' })
  async bootstrapCallPlanSchedule() {
    await this.scheduledCallPlanScheduler.bootstrap();
    return {
      success: true,
      message: 'Call plan schedule bootstrap completed',
    };
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
