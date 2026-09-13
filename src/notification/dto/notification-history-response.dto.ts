import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../core/dto/pagination.dto';
import { NotificationHistoryResponseDto, NotificationStatsDto } from './notification-history.dto';

export class NotificationHistoryListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Notification history berhasil diambil' })
  message: string;

  @ApiProperty({ type: [NotificationHistoryResponseDto] })
  data: NotificationHistoryResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      page: 1,
      limit: 10,
      total: 100,
      totalPages: 10,
    },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class NotificationStatsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Statistik notifikasi berhasil diambil' })
  message: string;

  @ApiProperty({ type: NotificationStatsDto })
  data: NotificationStatsDto;
}

export class UnreadCountResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Jumlah notifikasi belum dibaca berhasil diambil' })
  message: string;

  @ApiProperty({
    type: 'object',
    properties: {
      count: { type: 'number', example: 25 },
    },
  })
  data: {
    count: number;
  };
}

export class NotificationDetailResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Detail notifikasi berhasil diambil' })
  message: string;

  @ApiProperty({ type: NotificationHistoryResponseDto })
  data: NotificationHistoryResponseDto;
}

export class MarkAsReadResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Notifikasi berhasil ditandai sebagai dibaca' })
  message: string;

  @ApiProperty({ type: NotificationHistoryResponseDto })
  data: NotificationHistoryResponseDto;
}

export class BulkMarkAsReadResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '5 notifikasi berhasil ditandai sebagai dibaca' })
  message: string;
}

export class CleanupResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '50 notifikasi lama berhasil dihapus' })
  message: string;

  @ApiProperty({
    type: 'object',
    properties: {
      deleted: { type: 'number', example: 50 },
    },
  })
  data: {
    deleted: number;
  };
}
