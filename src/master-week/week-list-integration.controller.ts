import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MasterWeekService } from './master-week.service';
import { WeekListQueryDto } from './dto/week-list-query.dto';

@ApiTags('Week List Integration')
@Controller('week-list-integration')
@ApiBearerAuth('JWT-auth')
export class WeekListIntegrationController {
  constructor(private readonly masterWeekService: MasterWeekService) {}

  @Get()
  @ApiOperation({ summary: 'Get week list with filters' })
  @ApiResponse({
    status: 200,
    description: 'Return filtered week list.',
  })
  async getWeekList(@Query() query: WeekListQueryDto) {
    return await this.masterWeekService.findAll();
  }
}
