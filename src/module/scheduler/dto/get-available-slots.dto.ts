import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class GetAvailableSlotsDto {
  @ApiProperty({
    description: 'The service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'Service ID must be a string' })
  @IsNotEmpty({ message: 'Service ID is required' })
  serviceId: string;

  @ApiPropertyOptional({
    description:
      'The date to get available slots for (YYYY-MM-DD format). Defaults to today',
    example: '2025-11-19',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'The service provider ID to filter slots',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  serviceProviderId?: string;

  @ApiPropertyOptional({
    description: 'The business slug (alternative to businessId header)',
    example: 'acme-salon',
  })
  @IsOptional()
  @IsString()
  businessSlug?: string;

  @ApiPropertyOptional({
    description:
      'Booking ID to exclude from the "taken" set. Use when rescheduling so the booking does not count itself as occupying its current slot.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  excludeBookingId?: string;
}
