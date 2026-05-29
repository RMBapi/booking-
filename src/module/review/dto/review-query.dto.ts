import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationFilterDto } from '../../../common/dto/pagination-filter.dto';

export class ReviewQueryDto extends PaginationFilterDto {
  @ApiPropertyOptional({
    description: 'Filter reviews by rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseInt(String(value), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({
    description: 'Filter reviews left by a specific user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  userId?: string;
}
