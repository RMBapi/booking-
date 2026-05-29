import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class AnalyticsTimeseriesQueryDto {
  @ApiProperty({
    description: 'Metric to aggregate',
    enum: ['revenue', 'bookings'],
    example: 'revenue',
  })
  @IsIn(['revenue', 'bookings'])
  metric: 'revenue' | 'bookings';

  @ApiProperty({
    description: 'Bucket size',
    enum: ['day', 'week', 'month'],
    example: 'day',
  })
  @IsIn(['day', 'week', 'month'])
  granularity: 'day' | 'week' | 'month';

  @ApiProperty({
    description: 'Start date (ISO)',
    example: '2026-05-01',
  })
  @IsString()
  from: string;

  @ApiProperty({
    description: 'End date (ISO)',
    example: '2026-05-31',
  })
  @IsString()
  to: string;

  @ApiPropertyOptional({
    description: 'IANA timezone for bucket boundaries',
    example: 'America/New_York',
  })
  @IsString()
  @IsOptional()
  timezone?: string;
}
