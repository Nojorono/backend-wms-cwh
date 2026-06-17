import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ScheduledCallPlanFetchPayloadDto } from './dto/scheduled-call-plan-fetch-payload.dto';
import { ScheduledCallPlanScheduler } from './scheduled-call-plan.scheduler';
import { ScheduledCallPlanService } from './scheduled-call-plan.service';

@ApiTags('Scheduled Call Plan')
@Controller('scheduled-task/call-plan')
@ApiBearerAuth('JWT-auth')
export class ScheduledCallPlanController {
  constructor(
    private readonly scheduledCallPlanService: ScheduledCallPlanService,
    private readonly scheduler: ScheduledCallPlanScheduler,
  ) {}

  @Post('fetch-now')
  @ApiOperation({ summary: 'Fetch call plan data from Snowflake immediately' })
  @ApiResponse({ status: 200, description: 'Return call plan data from Snowflake.' })
  fetchNow(@Body() payload?: ScheduledCallPlanFetchPayloadDto) {
    return this.scheduledCallPlanService.runFetchNow(payload ?? {});
  }

  @Post('bootstrap')
  @ApiOperation({
    summary: 'Re-run schedule bootstrap',
    description:
      'Applies CALL_PLAN_SCHEDULE_MODE from env (database | memory | off). ' +
      'Use after changing cron env vars when mode=memory.',
  })
  @ApiResponse({ status: 201, description: 'Schedule bootstrap completed.' })
  async bootstrap() {
    await this.scheduler.bootstrap();
    return {
      success: true,
      message: 'Call plan schedule bootstrap completed',
    };
  }
}
