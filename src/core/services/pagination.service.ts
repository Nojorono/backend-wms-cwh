import { Injectable } from '@nestjs/common';
import { PaginationQueryDto, PaginationMetaDto, PaginatedResponseDto } from '../dto/pagination.dto';

@Injectable()
export class PaginationService {
  createPaginationMeta(page: number, limit: number, total: number): PaginationMetaDto {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  createPaginatedResponse<T>(
    data: T[],
    paginationQuery: any,
    total: number,
  ): PaginatedResponseDto<T> {
    const meta = this.createPaginationMeta(
      paginationQuery.page || 1,
      paginationQuery.limit || 10,
      total,
    );

    return {
      data,
      meta,
    };
  }

  getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  normalizePaginationQuery(query: any): PaginationQueryDto {
    return {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
      search: query.search || undefined,
      sortBy: query.sortBy || undefined,
      sortOrder: query.sortOrder || 'DESC',
    };
  }
}
