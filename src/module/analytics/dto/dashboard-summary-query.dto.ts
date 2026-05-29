import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class DashboardSummaryQueryDto {
  @ApiPropertyOptional({
    description: 'IANA timezone for date boundaries',
    example: 'America/New_York',
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Include cancelled bookings in counts',
    example: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  includeCancelled?: boolean;
}
