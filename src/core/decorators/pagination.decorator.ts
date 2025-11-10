import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function ApiPaginationQuery() {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (1-based)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page',
      example: 10,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search term',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      description: 'Sort field',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      type: String,
      description: 'Sort order',
      example: 'DESC',
      enum: ['ASC', 'DESC'],
    }),
    ApiQuery({
      name: 'status',
      required: false,
      type: String,
      description: 'Status filter',
    }),
  );
}
