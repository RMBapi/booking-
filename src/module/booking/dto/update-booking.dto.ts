import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import {
  BookingStatus,
  ConfirmationMethod,
  BookingSource,
} from '../../../types/enums';

export class UpdateBookingDto {
  @ApiPropertyOptional({
    description: 'The user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'User ID must be a string' })
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'The service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'Service ID must be a string' })
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'The service provider ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'Service provider ID must be a string' })
  @IsOptional()
  serviceProviderId?: string;

  @ApiPropertyOptional({
    description: 'The booking time in JSON format',
    example: { start: '2025-11-19T10:00:00Z', end: '2025-11-19T11:00:00Z' },
  })
  @IsOptional()
  bookingTime?: any;

  @ApiPropertyOptional({
    description:
      'The status of the booking. Cancelled is rejected on this endpoint — use POST /booking/:id/cancel instead.',
    enum: BookingStatus,
    example: BookingStatus.Confirmed,
  })
  @IsEnum(BookingStatus, { message: 'Status must be a valid BookingStatus' })
  @IsOptional()
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'The confirmation method',
    enum: ConfirmationMethod,
    example: ConfirmationMethod.Email,
  })
  @IsEnum(ConfirmationMethod, {
    message: 'Confirmation method must be a valid ConfirmationMethod',
  })
  @IsOptional()
  confirmationMethod?: ConfirmationMethod;

  @ApiPropertyOptional({
    description: 'The booking source',
    enum: BookingSource,
    example: BookingSource.Website,
  })
  @IsEnum(BookingSource, {
    message: 'Booking source must be a valid BookingSource',
  })
  @IsOptional()
  bookingSource?: BookingSource;

  @ApiPropertyOptional({
    description: 'Customer notes',
    example: 'Please call before arrival',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Customer notes must be a string' })
  @IsOptional()
  customerNotes?: string;
}
