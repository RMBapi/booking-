import { Injectable } from '@nestjs/common';

type SortOrder = 'asc' | 'desc';

@Injectable()
export class PaginationService {
  buildPaginationOptions(queryDto: { page?: number; limit?: number; sortBy?: string; sortOrder?: SortOrder }) {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const skip = (page - 1) * limit;

    const sortOrder: SortOrder = queryDto.sortOrder === 'desc' ? 'desc' : 'asc';

    let orderBy: Record<string, SortOrder>;
    if (queryDto.sortBy) {
      orderBy = { [queryDto.sortBy]: sortOrder };
    } else {
      orderBy = { createdAt: 'desc' };
    }

    return {
      skip,
      take: limit,
      orderBy: orderBy as any, // Type assertion needed for dynamic field names
    };
  }

  buildMeta(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
