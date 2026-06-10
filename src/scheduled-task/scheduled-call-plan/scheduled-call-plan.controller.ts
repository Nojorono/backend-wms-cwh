import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ScheduledCallPlanFetchPayloadDto } from './dto/scheduled-call-plan-fetch-payload.dto';
import { ScheduledCallPlanService } from './scheduled-call-plan.service';

@ApiTags('Scheduled Call Plan')
@Controller('scheduled-task/call-plan')
@ApiBearerAuth('JWT-auth')
export class ScheduledCallPlanController {
  constructor(private readonly scheduledCallPlanService: ScheduledCallPlanService) {}

  @Post('fetch-now')
  @ApiOperation({ summary: 'Fetch call plan data from Snowflake immediately' })
  @ApiResponse({ status: 200, description: 'Return call plan data from Snowflake.' })
  fetchNow(@Body() payload?: ScheduledCallPlanFetchPayloadDto) {
    return this.scheduledCallPlanService.runFetchNow(payload ?? {});
  }

  @Post('bootstrap')
  @ApiOperation({ summary: 'Ensure default fetch call plan cron job exists' })
  @ApiResponse({ status: 201, description: 'Default job ensured.' })
  async bootstrap() {
    await this.scheduledCallPlanService.ensureDefaultFetchJob();
    return {
      success: true,
      message: 'Default fetch call plan job ensured',
    };
  }
}
