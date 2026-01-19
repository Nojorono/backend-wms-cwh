import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export interface PaginationQueryParam {
  name: string;
  required?: boolean;
  type?: any;
  description?: string;
  example?: any;
  enum?: any[];
}

export function ApiFlexiblePaginationQuery(additionalParams: PaginationQueryParam[] = []) {
  const baseParams: PaginationQueryParam[] = [
    {
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (1-based)',
      example: 1,
    },
    {
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page',
      example: 10,
    },
    {
      name: 'search',
      required: false,
      type: String,
      description: 'Search term',
      example: 'search term',
    },
    {
      name: 'sortBy',
      required: false,
      type: String,
      description: 'Sort field',
      example: 'createdAt',
    },
    {
      name: 'sortOrder',
      required: false,
      type: String,
      description: 'Sort order',
      example: 'DESC',
      enum: ['ASC', 'DESC'],
    },
  ];

  const allParams = [...baseParams, ...additionalParams];

  return applyDecorators(
    ...allParams.map((param) =>
      ApiQuery({
        name: param.name,
        required: param.required || false,
        type: param.type || String,
        description: param.description,
        example: param.example,
        enum: param.enum,
      }),
    ),
  );
}
