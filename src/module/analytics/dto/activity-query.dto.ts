import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ActivityQueryDto {
  @ApiPropertyOptional({
    description: 'Max items to return',
    example: 20,
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
    description: 'Cursor for pagination (ISO timestamp)',
    example: '2026-05-29T12:00:00.000Z',
  })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated activity types',
    example: 'booking.created,booking.confirmed',
  })
  @IsString()
  @IsOptional()
  types?: string;
}
