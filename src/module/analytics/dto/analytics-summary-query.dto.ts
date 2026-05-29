import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class AnalyticsSummaryQueryDto {
  @ApiProperty({
    description: 'Summary range',
    enum: ['30d', '90d', 'year'],
    example: '30d',
  })
  @IsIn(['30d', '90d', 'year'])
  range: '30d' | '90d' | 'year';

  @ApiPropertyOptional({
    description: 'IANA timezone for date boundaries',
    example: 'America/New_York',
  })
  @IsString()
  @IsOptional()
  timezone?: string;
}
