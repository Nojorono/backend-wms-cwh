import { ApiProperty } from '@nestjs/swagger';

export class ServerDatetimeResponseDto {
  @ApiProperty({ example: '2026-06-24T09:15:30.123Z', description: 'Server time in UTC (ISO 8601)' })
  utc: string;

  @ApiProperty({ example: 'Asia/Jakarta', description: 'Application default timezone' })
  timezone: string;

  @ApiProperty({
    example: '24 Jun 2026, 16.15.30',
    description: 'Server time formatted in application timezone',
  })
  local: string;

  @ApiProperty({ example: '2026-06-24', description: 'Date part in application timezone (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ example: '16:15:30', description: 'Time part in application timezone (HH:mm:ss)' })
  time: string;

  @ApiProperty({ example: 1719227730123, description: 'Unix timestamp in milliseconds' })
  timestamp: number;
}
