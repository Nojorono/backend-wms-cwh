import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INDONESIA_TIMEZONE } from '../core/utils/date-transformer.util';
import { ServerDatetimeResponseDto } from './dto/server-datetime-response.dto';

@Injectable()
export class CommonService {
  constructor(private readonly configService: ConfigService) {}

  getServerDatetime(): ServerDatetimeResponseDto {
    const now = new Date();
    const timezone =
      this.configService.get<string>('COMMON_SERVER_TIMEZONE')?.trim() || INDONESIA_TIMEZONE;

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const date = `${partMap.year}-${partMap.month}-${partMap.day}`;
    const time = `${partMap.hour}:${partMap.minute}:${partMap.second}`;

    const local = new Intl.DateTimeFormat('id-ID', {
      timeZone: timezone,
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(now);

    return {
      utc: now.toISOString(),
      timezone,
      local,
      date,
      time,
      timestamp: now.getTime(),
    };
  }
}
