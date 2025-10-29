import { PaginationQueryDto, PaginatedResponseDto } from '../dto/pagination.dto';
import { PaginationService } from '../services/pagination.service';

export class PaginationHelper {
  constructor(private readonly paginationService: PaginationService) {}

  async paginate<T>(
    data: T[],
    paginationQuery: PaginationQueryDto,
    total: number,
  ): Promise<PaginatedResponseDto<T>> {
    return this.paginationService.createPaginatedResponse(data, paginationQuery, total);
  }

  getSkip(page: number, limit: number): number {
    return this.paginationService.getSkip(page, limit);
  }

  normalizeQuery(query: any): PaginationQueryDto {
    return this.paginationService.normalizePaginationQuery(query);
  }
}
