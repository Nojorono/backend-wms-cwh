import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../core/decorators/public.decorator';
import { CommonService } from './common.service';
import { ServerDatetimeResponseDto } from './dto/server-datetime-response.dto';

@ApiTags('Common')
@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Public()
  @Get('server-datetime')
  @ApiOperation({
    summary: 'Get current server datetime',
    description:
      'Returns server time in UTC and application timezone (default Asia/Jakarta). ' +
      'Override timezone with COMMON_SERVER_TIMEZONE env.',
  })
  @ApiResponse({ status: 200, type: ServerDatetimeResponseDto })
  getServerDatetime(): ServerDatetimeResponseDto {
    return this.commonService.getServerDatetime();
  }
}
