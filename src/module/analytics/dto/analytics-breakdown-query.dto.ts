import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class AnalyticsBreakdownQueryDto {
  @ApiProperty({
    description: 'Breakdown grouping',
    enum: ['service', 'provider'],
    example: 'service',
  })
  @IsIn(['service', 'provider'])
  groupBy: 'service' | 'provider';

  @ApiProperty({
    description: 'Breakdown range',
    enum: ['30d', '90d', 'year'],
    example: '30d',
  })
  @IsIn(['30d', '90d', 'year'])
  range: '30d' | '90d' | 'year';

  @ApiPropertyOptional({
    description: 'Max items',
    example: 5,
  })
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseInt(String(value), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort key',
    enum: ['bookings', 'revenue'],
    example: 'bookings',
  })
  @IsIn(['bookings', 'revenue'])
  @IsOptional()
  sortBy?: 'bookings' | 'revenue';
}
